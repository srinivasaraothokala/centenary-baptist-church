# Centenary Baptist Church - Selenium Automation Testing

This directory contains the Python Selenium automated test suite for the Centenary Baptist Church website.

## Prerequisites

- Python 3.8+
- Google Chrome browser installed
- ChromeDriver (automatically managed by Selenium 4.10+)

## Installation

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` to include your actual base URLs and any necessary test credentials. The default URLs are:
- `BASE_URL`: https://cbcsecbad.in
- `ALT_URL`: https://www.cbcsecbad.in

*Do not commit real passwords or API secrets to version control.*

## Running the Tests

To run the entire test suite and generate an HTML report:

```bash
pytest
```

To run a specific test:

```bash
pytest tests/test_e2e.py::test_01_homepage_loading
```

### Test Reports

After running the tests, an HTML report will be generated at `test-reports/report.html`.
If any test fails, a screenshot of the browser state at the time of failure will be saved in `test-reports/screenshots/`.

## Test Scenarios Covered

1. Homepage Loading
2. WWW Domain and HTTPS
3. Navigation and Page Refresh
4. Pastor Profiles and Images
5. Donation Page and QR Code
6. Contact Form Validation
7. Admin Login
8. API Health and Error Handling
9. Broken Links and Static Assets
10. Responsive Layout
11. Performance and Browser Stability
12. Security and Privacy Checks

## Important Notes

- Tests are designed to run safely against the production environment without causing destructive changes.
- The `test_06_contact_form` relies on invalid form submission checks. It does not send real emails to avoid spamming the church's inbox.
- The `test_07_admin_login` relies on invalid credential rejection. It verifies the form and auth flow without exposing real passwords.
