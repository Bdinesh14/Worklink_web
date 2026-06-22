"""
conftest.py — WorkLink Android Appium Test Configuration
Shared fixtures for all 350 test cases.
"""
import pytest
import time
import os
from appium import webdriver
from appium.options import UiAutomator2Options

APK_PACKAGE = "com.dinesh2525.worklink"
APK_ACTIVITY = "com.dinesh2525.worklink.MainActivity"
APPIUM_PORT = int(os.environ.get("APPIUM_PORT", "4723"))

def build_options():
    options = UiAutomator2Options()
    options.platform_name = "Android"
    options.automation_name = "UiAutomator2"
    options.device_name = os.environ.get("ANDROID_DEVICE", "emulator-5554")
    options.no_reset = False
    options.full_reset = False
    options.new_command_timeout = 120
    options.auto_grant_permissions = True
    options.ignore_hidden_api_policy_error = True

    # If APK path is available, install it
    apk_path = os.environ.get("APK_PATH", "")
    if apk_path and os.path.exists(apk_path) and os.path.getsize(apk_path) > 10000:
        options.app = apk_path
    else:
        # Use package/activity if already installed
        options.app_package = APK_PACKAGE
        options.app_activity = APK_ACTIVITY

    return options


@pytest.fixture(scope="session")
def driver():
    """Session-scoped Appium driver (shared across all tests)."""
    options = build_options()
    driver_instance = None
    try:
        driver_instance = webdriver.Remote(
            f"http://localhost:{APPIUM_PORT}",
            options=options
        )
        driver_instance.implicitly_wait(8)
        yield driver_instance
    except Exception as e:
        print(f"⚠️ Driver setup failed: {e}")
        pytest.skip(f"Appium driver unavailable: {e}")
        yield None
    finally:
        if driver_instance:
            try:
                driver_instance.quit()
            except Exception:
                pass


@pytest.fixture(autouse=True)
def reset_app_between_tests(driver):
    """Optionally reset between tests if needed."""
    yield
    # Don't reset between every test — too slow. Just yield.
