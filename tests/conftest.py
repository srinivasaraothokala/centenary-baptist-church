import pytest
import os
import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def pytest_addoption(parser):
    parser.addoption("--base-url", action="store", default=os.getenv("BASE_URL", "https://cbcsecbad.in"))
    parser.addoption("--alt-url", action="store", default=os.getenv("ALT_URL", "https://www.cbcsecbad.in"))

@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url")

@pytest.fixture(scope="session")
def alt_url(request):
    return request.config.getoption("--alt-url")

@pytest.fixture(scope="function")
def driver(request):
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--ignore-certificate-errors")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    
    yield driver
    
    if request.node.rep_call.failed:
        # Take a screenshot if the test failed
        try:
            os.makedirs("test-reports/screenshots", exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test-reports/screenshots/failed_{request.node.name}_{timestamp}.png"
            driver.save_screenshot(filename)
            print(f"\\nScreenshot saved to: {filename}")
        except Exception as e:
            print(f"\\nFailed to take screenshot: {e}")
            
    driver.quit()

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    # execute all other hooks to obtain the report object
    outcome = yield
    rep = outcome.get_result()
    # set a report attribute for each phase of a call, which can
    # be "setup", "call", "teardown"
    setattr(item, "rep_" + rep.when, rep)
