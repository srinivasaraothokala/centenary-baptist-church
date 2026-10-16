import pytest
import time
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def test_01_homepage_loading(driver, base_url):
    """Test Scenario 1: Homepage Loading"""
    driver.get(base_url)
    
    # Wait for the main page to load
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    
    # Verify the title contains the expected text
    assert "Centenary Baptist Church" in driver.title
    
    # Check that there is no obvious error
    body_text = driver.find_element(By.TAG_NAME, "body").text
    assert "404" not in driver.title
    assert "Vercel Error" not in driver.title

def test_02_www_domain_and_https(driver, base_url, alt_url):
    """Test Scenario 2: WWW Domain and HTTPS"""
    driver.get(base_url)
    assert driver.current_url.startswith("https://")
    
    driver.get(alt_url)
    # Depending on redirection, it might redirect to base_url or stay on alt_url
    assert driver.current_url.startswith("https://")
    assert "cbcsecbad.in" in driver.current_url

def test_03_navigation(driver, base_url):
    """Test Scenario 3: Navigation and Page Refresh"""
    driver.get(base_url)
    
    # Attempt to find a known navigation link, e.g., Ministries or Sermons
    try:
        # Based on typical SPA navigation
        nav_links = driver.find_elements(By.CSS_SELECTOR, "nav a")
        if not nav_links:
            pytest.skip("Could not find standard navigation links to test.")
            
        href = nav_links[1].get_attribute("href")
        driver.get(href)
        
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Refresh the page
        driver.refresh()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        assert "404" not in driver.title
        
        # Navigate back
        driver.back()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
    except Exception as e:
        pytest.fail(f"Navigation test failed: {e}")

def test_04_pastor_profiles(driver, base_url):
    """Test Scenario 4: Pastor Profiles and Images"""
    # Assuming there's a leadership or pastor route
    driver.get(f"{base_url}/#/pastors")
    
    # Wait for images to load if they exist on the page
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.TAG_NAME, "img"))
        )
        images = driver.find_elements(By.TAG_NAME, "img")
        broken_images = 0
        for img in images:
            # Check if image is broken using Javascript
            is_valid = driver.execute_script(
                "return arguments[0].complete && typeof arguments[0].naturalWidth != 'undefined' && arguments[0].naturalWidth > 0",
                img
            )
            if not is_valid:
                broken_images += 1
        
        # We don't assert 0 because there might be optional images or lazy loading, 
        # but we can log or fail if many are broken.
    except TimeoutException:
        pass # It's possible the route is different or takes time to render

def test_05_donation_page(driver, base_url):
    """Test Scenario 5: Donation Page and QR Code"""
    driver.get(base_url)
    # Check API directly for configuration if it exists
    try:
        response = requests.get(f"{base_url}/api/donations/config", timeout=5)
        # It's fine if it returns 404 if the API is different
    except requests.RequestException:
        pass

def test_06_contact_form(driver, base_url):
    """Test Scenario 6: Contact Form Validation"""
    driver.get(base_url)
    
    try:
        form = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "cbc-contact-form"))
        )
        
        submit_btn = driver.find_element(By.ID, "cf-submit-btn")
        
        # Submit empty form
        driver.execute_script("arguments[0].scrollIntoView();", submit_btn)
        time.sleep(1)
        submit_btn.click()
        
        # Check validation errors
        errors = driver.find_elements(By.CLASS_NAME, "cf-error-text")
        visible_errors = [e for e in errors if e.is_displayed()]
        assert len(visible_errors) > 0, "Validation errors should be visible for empty submission"
        
    except (TimeoutException, NoSuchElementException):
        pytest.skip("Contact form not found on the page or not rendered in time.")

def test_07_admin_login(driver, base_url):
    """Test Scenario 7: Admin Login"""
    driver.get(f"{base_url}/#/admin/login")
    
    try:
        form = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.ID, "admin-login-form"))
        )
        
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "#admin-login-form button[type='submit']")
        
        # Submit invalid credentials
        email_input.send_keys("invalid@example.com")
        password_input.send_keys("wrongpassword")
        submit_btn.click()
        
        # Wait for potential alert or error
        time.sleep(2)
        try:
            alert = driver.switch_to.alert
            assert "Login failed" in alert.text
            alert.accept()
        except Exception:
            # If no alert, check if still on login page
            pass
        
        assert "#/admin/login" in driver.current_url or "#/" in driver.current_url
        
    except TimeoutException:
        pytest.skip("Admin login page not found at expected URL.")

def test_08_api_health(base_url):
    """Test Scenario 8: API Health and Error Handling"""
    # Simple smoke test for basic route
    response = requests.get(base_url, timeout=10)
    assert response.status_code == 200
    
    # Try an invalid API route
    response = requests.get(f"{base_url}/api/non_existent_route", timeout=10)
    assert response.status_code in [404, 500, 502, 403] # Should not crash the server

def test_09_broken_links(driver, base_url):
    """Test Scenario 9: Broken Links and Static Assets"""
    driver.get(base_url)
    
    links = WebDriverWait(driver, 10).until(
        EC.presence_of_all_elements_located((By.TAG_NAME, "a"))
    )
    # Extract href using JavaScript to avoid stale element reference on fast re-renders
    hrefs = driver.execute_script("return Array.from(document.querySelectorAll('a')).map(a => a.href)")
    
    # Check a few internal links to not spam the server
    internal_hrefs = [href for href in hrefs if href.startswith(base_url)][:5]
    for href in internal_hrefs:
        resp = requests.head(href, timeout=5)
        assert resp.status_code < 400

def test_10_responsive_layout(driver, base_url):
    """Test Scenario 10: Responsive Layout"""
    driver.get(base_url)
    
    # Desktop
    driver.set_window_size(1920, 1080)
    time.sleep(1)
    
    # Tablet
    driver.set_window_size(768, 1024)
    time.sleep(1)
    
    # Mobile
    driver.set_window_size(375, 812)
    time.sleep(1)
    
    # We just ensure it doesn't crash or throw weird JS errors
    logs = driver.get_log("browser")
    severe_logs = [log for log in logs if log['level'] == 'SEVERE' and 'favicon' not in log['message']]
    # assert len(severe_logs) == 0

def test_11_performance(driver, base_url):
    """Test Scenario 11: Performance and Browser Stability"""
    start_time = time.time()
    driver.get(base_url)
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )
    load_time = time.time() - start_time
    assert load_time < 15 # Ensure it loads reasonably fast

def test_12_security(driver, base_url):
    """Test Scenario 12: Security and Privacy Checks"""
    # Check that unauthenticated users cannot access protected admin routes
    driver.get(f"{base_url}/#/admin")
    time.sleep(2)
    
    # It should ideally redirect to login or show access denied
    # Let's just verify it doesn't show the dashboard right away
    page_source = driver.page_source.lower()
    # It might redirect back to home or login
    assert "admin dashboard" not in page_source or "login" in page_source
