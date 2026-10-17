import re


def clean_column(name: str) -> str:
    """Normalise column names, e.g. 'spotting_ urination' -> 'spotting_urination'."""
    name = name.strip()
    return re.sub(r"_?\s+_?", "_", name)


def clean_label(label: str) -> str:
    return re.sub(r"\s+", " ", str(label).strip())
