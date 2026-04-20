"""Rate-limited async HTTP client for the Rechtspraak API."""

import asyncio
import logging
import time

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .config import MAX_CONCURRENT_REQUESTS, REQUESTS_PER_SECOND, REQUEST_TIMEOUT, MAX_RETRY_ATTEMPTS

logger = logging.getLogger(__name__)


class RateLimiter:
    """Token bucket rate limiter."""

    def __init__(self, rate: float):
        self.rate = rate
        self.tokens = rate
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.rate, self.tokens + elapsed * self.rate)
            self.last_refill = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.rate
                await asyncio.sleep(wait_time)
                self.tokens = 0
            else:
                self.tokens -= 1


class RechtspraakClient:
    """Async HTTP client with rate limiting and retries."""

    def __init__(
        self,
        concurrency: int = MAX_CONCURRENT_REQUESTS,
        rate: float = REQUESTS_PER_SECOND,
        timeout: float = REQUEST_TIMEOUT,
    ):
        self.semaphore = asyncio.Semaphore(concurrency)
        self.rate_limiter = RateLimiter(rate)
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None
        self._request_count = 0
        self._error_count = 0

    async def __aenter__(self):
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True,
            limits=httpx.Limits(max_connections=MAX_CONCURRENT_REQUESTS + 2),
        )
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(MAX_RETRY_ATTEMPTS),
        wait=wait_exponential(multiplier=2, min=1, max=60),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TransportError)),
        reraise=True,
    )
    async def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        await self.rate_limiter.acquire()
        async with self.semaphore:
            self._request_count += 1
            response = await self._client.request(method, url, **kwargs)
            if response.status_code == 429:
                logger.warning("Rate limited (429), backing off...")
                self._error_count += 1
                raise httpx.HTTPStatusError(
                    "Rate limited",
                    request=response.request,
                    response=response,
                )
            if response.status_code >= 500:
                self._error_count += 1
                raise httpx.HTTPStatusError(
                    f"Server error {response.status_code}",
                    request=response.request,
                    response=response,
                )
            return response

    async def get(self, url: str, **kwargs) -> httpx.Response:
        return await self._request("GET", url, **kwargs)

    async def get_bytes(self, url: str, **kwargs) -> bytes:
        response = await self.get(url, **kwargs)
        return response.content

    @property
    def stats(self) -> dict:
        return {
            "requests": self._request_count,
            "errors": self._error_count,
        }
