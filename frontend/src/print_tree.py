import os

# Folders to ignore
IGNORE_FOLDERS = {".venv", "__pycache__", "node_modules", "chroma_db", "src", "fbx_model", "stl_model"}

def print_tree(path, prefix="", root_path=None):
    """Recursively prints a directory tree with relative paths, showing skipped folders."""
    if root_path is None:
        root_path = path

    try:
        items = os.listdir(path)
    except PermissionError:
        return  # Skip folders we can't access

    items.sort()  # Sort alphabetically

    for i, item in enumerate(items):
        full_path = os.path.join(path, item)
        rel_path = os.path.relpath(full_path, root_path)

        connector = "└── " if i == len(items) - 1 else "├── "

        if os.path.isdir(full_path) and item in IGNORE_FOLDERS:
            # Show the folder exists but skip its contents
            print(prefix + connector + rel_path + " [skipped]")
            continue

        print(prefix + connector + rel_path)

        if os.path.isdir(full_path):
            extension = "    " if i == len(items) - 1 else "│   "
            print_tree(full_path, prefix + extension, root_path)

if __name__ == "__main__":
    directory = os.getcwd()  # Current working directory
    print_tree(directory)
