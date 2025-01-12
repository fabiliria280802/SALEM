
## Read this in another language
- [Lea esto en español](Readme-backend-esp.md)

# Prerequisites
- Anaconda (latest version)
- Python 3 & pip
- torch
- camelot-py

# How to run it locally?

You must `cd` into your environment directory, e.g., `/home/fls2808/.conda/envs/pytorch-env` or `/Users/mateoavila/.conda/envs/pytorch-env`.

- If you don't have a /envs you must need to use:

```bash
    mkdir /envs
```

- If you need to create a new virtual environment, use:

```bash
python -m venv pytorch-env # or python3 -m venv pytorch-env
```
Activate it by following step 1.

# STEPS
1. Activate a virtual environment  
   If you already have a virtual environment (e.g., pytorch-env), activate it with the following commands:
   - On Linux/macOS:

```bash
conda activate pytorch-env
```

   - On Windows (PowerShell):

```bash
.\pytorch-env\Scripts\activate
```

   When the environment is activated, you will see the name of the environment in parentheses at the beginning of the prompt, like this:

```bash
(pytorch-env) user@machine:~$
```

2. Deactivate a virtual environment  
   To deactivate an active environment and return to the global system environment, simply run:

```bash
deactivate
```

## How to read dependencies from requirements.txt?
```bash
pip install -r requirements.txt # or pip3 install -r requirements.txt
```

## Adding new dependencies to requirements.txt
Instead of using `pip freeze`, use `pip list` to get only the names and versions of installed packages:

```bash
pip list --format=freeze > requirements.txt
```

**Note:** this project was develop in linux/Fedora 41 & MacOS 15.2.0, for more info contact colaborators team.