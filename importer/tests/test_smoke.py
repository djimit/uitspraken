"""Smoke tests for rechtspraak importer."""
import importlib


def test_package_imports():
    """Package can be imported without errors."""
    importlib.import_module("rechtspraak")


def test_cli_entry_exists():
    """CLI entry point is importable."""
    from rechtspraak.cli import cli
    assert cli is not None


def test_pipeline_imports():
    """Pipeline module imports."""
    importlib.import_module("rechtspraak.pipeline")


def test_parser_imports():
    """Parser module imports."""
    importlib.import_module("rechtspraak.parser")
