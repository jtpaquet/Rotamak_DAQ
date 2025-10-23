# Agent Guidelines for QREX DAQ Project

## Commands
- Run dev server: `python manage.py runserver`
- Run all tests: `python manage.py test`
- Run specific test: `python manage.py test <app_name>.<TestClass>.<test_method>`
- Run migrations: `python manage.py migrate`
- Create migrations: `python manage.py makemigrations`

## Project Structure
- Django 5.2.7 backend with SQLite database
- Frontend app serves React build from `frontend/templates/index.html`
- Static files served from `frontend/` directory

## Code Style
- Follow Django conventions and PEP 8
- Use pathlib Path for file paths (e.g., `BASE_DIR / 'subdir'`)
- Import order: stdlib, third-party (django), local apps
- Use snake_case for variables/functions, PascalCase for classes
- Prefer function-based views unless CBVs add clear value
- Use Django ORM for database operations
- Add inline comments for PXI slot configurations only when needed
