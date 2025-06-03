import pytest
from users.models import CustomUser, Profile
import json
from new_badges.models import Badge

@pytest.mark.django_db
class TestUserRoutes:
    
    # ------------------------------------------------------------------
    # USE CASE 1: register, login - valid user flow
    # ------------------------------------------------------------------
    
    def test_register_and_login(self, client):
        """
        UC1 - Full flow:
        - Register a user with email/password
        - Login with the same credentials
        - Access current user profile
        """
        
        payload = {
            "email": "testuser@example.com",
            "password": "Test12345",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"]

        login_payload = {"email": "testuser@example.com", "password": "Test12345"}
        res_login = client.post("/api/users/login", data=json.dumps(login_payload), content_type="application/json")
        assert res_login.status_code == 200, f"Login failed: {res_login.status_code} {res_login.content}"

        res_me = client.get("/api/users/user")
        assert res_me.status_code == 200, f"Get user failed: {res_me.status_code} {res_me.content}"
        assert res_me.json()["id"] == user_id
        
    # ------------------------------------------------------------------
    # Use Case 1 - register, login - invalid user flow
    # ------------------------------------------------------------------
        

    def test_register_duplicate_email(self, client):
        """
        UC1 - Register: should not allow registering with duplicate email
        """
        
        payload = {
            "email": "dupe@example.com",
            "password": "Test12345",
            "referral_code": None,
        }
        client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400
        

    def test_login_invalid(self, client):
        """
        UC1 - Login: should fail with wrong credentials
        """
        
        login_payload = {"email": "fake@example.com", "password": "WrongPass"}
        res = client.post("/api/users/login", data=json.dumps(login_payload), content_type="application/json")
        assert res.status_code == 401

    def test_get_profile(self, client):
        """
        UC1 - fetch another user's profile by ID
        """
        
        user = CustomUser.objects.create_user(username="profiletest", email="profiletest@example.com", password="Password123")
        client.post("/api/users/login", data=json.dumps({"email": "profiletest@example.com", "password": "Password123"}), content_type="application/json")
        res = client.get(f"/api/users/get_profile/{user.id}")
        assert res.status_code == 200
        
        
    def test_invalid_email_format_registration(self, client):
        """
        Should reject registration if email format is invalid
        """
        
        payload = {
            "email": "not-an-email",
            "password": "ValidPass123",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400, f"Expected 400 for invalid email, got {res.status_code}"

    def test_empty_email_registration(self, client):
        """
        Should reject registration if email is empty
        """
        
        payload = {
            "email": "",
            "password": "ValidPass123",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400, f"Expected 400 for empty email, got {res.status_code}"

    def test_missing_email_registration(self, client):
        """
        Should reject registration if email is missing
        """
        
        payload = {
            "password": "ValidPass123",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 422, f"Expected 400 for missing email, got {res.status_code}"

    def test_invalid_email_login(self, client):
        """
        Should reject login with improperly formatted email
        """
        
        payload = {
            "email": "notanemail",
            "password": "ValidPass123"
        }
        res = client.post("/api/users/login", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 401 or res.status_code == 400, f"Expected failure code, got {res.status_code}"

    def test_missing_email_login(self, client):
        """
        Should reject login with missing email field
        """
        
        payload = {
            "password": "ValidPass123"
        }
        res = client.post("/api/users/login", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 422, f"Expected 400 for missing email, got {res.status_code}"
        
    
    # ------------------------------------------------------------------
    # USE CASE 2: verification as a student - valid user flow
    # ------------------------------------------------------------------    
        

    def test_register_with_student_email_gets_student_badge(self, client):
        """
        UC2 - Register with academic email (like @post.bgu.ac.il)
        - Should result in user being awarded the 'Student' badge after completing profile (same as real user flow).
        """
        
        Badge.objects.get_or_create(name="Student")

        email = "student@post.bgu.ac.il"
        password = "StudentPass123"
        payload = {
            "email": email,
            "password": password,
            "referral_code": None,
        }

        # 1. Register
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200
        user_id = res.json()["id"]

        # 2. Login (to get session)
        client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200
        
        # 3. Complete profile- this triggers badge logic in real app
        res = client.post("/api/users/edit_profile", data=({
            "name": "Test",
            "phone": "0500000000",
            "gender": "M",
            "birth_date": "2000-01-01"
        }))

        # # 4. Assert the badge is assigned
        res = client.get(f"/api/users/get_profile/{user_id}")
        assert res.status_code == 200
        badge_names = [b["name"] for b in res.json()["badges"]]
        assert "Student" in badge_names, f"Expected 'Student' badge, found {badge_names}"


    # ------------------------------------------------------------------
    # more invalid user flows for registration and login
    # ------------------------------------------------------------------

    def test_register_with_weak_password(self, client):
        """
        Should fail registration if password is too short or weak
        """
        
        payload = {
            "email": "weakpass@example.com",
            "password": "123",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400

    def test_register_with_missing_password(self, client):
        """
        Should fail registration if password is missing
        """
        
        payload = {
            "email": "missingpass@example.com",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 422

    def test_login_with_wrong_password(self, client):
        """
        Should fail login if password is incorrect
        """
        
        payload = {
            "email": "loginfail@example.com",
            "password": "CorrectPassword123",
            "referral_code": None,
        }
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200
        
        payload = {
            "email": "loginfail@example.com",
            "password": "WrongPassword"
        }
        res = client.post("/api/users/login", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 401



    def test_change_password_with_wrong_old_password(self, client):
        """
        Should fail password change if old password is incorrect
        """
        
        
        email = "changepass@example.com"
        password = "Correct123"
        payload = {
            "email": email,
            "password": password,
            "referral_code": None,
        }
        
        res = client.post("/api/users/register", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200
        
        client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200
        
        res = client.put("/api/users/change_password/", data=json.dumps({
            "old_password": "WrongOldPassword",
            "new_password": "NewSecurePass123"
        }), content_type="application/json")

        assert res.status_code == 400
        
        
        
    def test_update_age_with_negative_number(self, client):
        """
        Should fail when age is set to a negative number
        """
        
        email = "test@example.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None
        }), content_type="application/json")
        assert res.status_code == 200

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200

        # Negative age
        res = client.post("/api/users/edit_profile", data={
            "age": -5
        })
        assert res.status_code == 400


    # ------------------------------------------------------------------
    # user profile updates - valid user flow
    # ------------------------------------------------------------------

    def test_update_name(self, client):
        """
        User can update name
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        # Update name
        res = client.post("/api/users/edit_profile", data=({
            "name": "New Name"
        }))
        assert res.status_code == 200

        assert res.json()["name"] == "New Name", f"Expected name 'New Name', got {res.json()['name']}"
        
        
    def test_update_bio(self, client):
        """
        User can update bio
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        # Update bio
        res = client.post("/api/users/edit_profile", data=({
            "bio": "Live Laugh Love"
        }))
        assert res.status_code == 200

        assert res.json()["bio"] == "Live Laugh Love", f"Expected bio 'Live Laugh Love', got {res.json()['bio']}"



    def test_update_age(self, client):
        """
        User can update birth date 
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        # Update age
        res = client.post("/api/users/edit_profile", data=({
            "age": 23
        }))
        assert res.status_code == 200

        assert res.json()["age"] == 23, f"Expected age 23, got {res.json()['age']}"



    def test_update_facebook(self, client):
        """
        User can update Facebook link
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        url = "https://facebook.com/user123"
        
        # Update facebook
        res = client.post("/api/users/edit_profile", data=({
            "facebook": url
        }))
        assert res.status_code == 200
        assert res.json()["facebook"] == url, f"Expected facebook_url to be {url}, got {res.json()['facebook']}"

        
        
    def test_update_linkedin(self, client):
        """
        User can update LinkedIn link
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        url = "https://linkedin.com/in/testuser"
        
        # Update linkedin
        res = client.post("/api/users/edit_profile", data=({
            "linkedin": url
        }))
        assert res.status_code == 200
        assert res.json()["linkedin"] == url, f"Expected linkedin_url to be {url}, got {res.json()['linkedin']}"



    def test_update_instagram(self, client):
        """
        User can update Instagram link
        """     
           
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        url = "https://instagram.com/testuser"
        
        # Update instagram
        res = client.post("/api/users/edit_profile", data=({
            "instagram": url
        }))
        assert res.status_code == 200
        assert res.json()["instagram"] == url, f"Expected instagram to be {url}, got {res.json()['instagram']}"

    def test_update_phone(self, client):
        """
        User can update phone number
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        # Update phone
        res = client.post("/api/users/edit_profile", data=({
            "phone_number": "+9723456789012"
        }))
        assert res.status_code == 200

        assert res.json()["phone_number"] == "+9723456789012", f"Expected phone_number +9723456789012, got {res.json()['phone_number']}"

    def test_change_password(self, client):
        """
        User should be able to change their password after authenticating
        """
        
        email = "test@test.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"] 

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"
        
        # Change password
        new_password = "NewPassword123"
        res = client.put("/api/users/change_password/", data=json.dumps({
            "old_password": password,
            "new_password": new_password
        }), content_type="application/json")
        assert res.status_code == 200, f"Change password failed: {res.status_code} {res.content}"
        
        
        #logout
        res = client.post("/api/users/logout")
        assert res.status_code == 200, f"Logout failed: {res.status_code} {res.content}"
        
        # Login with new password
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": new_password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login with new password failed: {res.status_code} {res.content}"


    def test_change_email(self, client):
        """
        User should be able to change their email after authenticating
        """
        
        original_email = "test@test.com"
        password = "Password123"
        new_email = "newtest@test.com"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": original_email,
            "password": password,
            "referral_code": None,
        }), content_type="application/json")
        assert res.status_code == 200, f"Register failed: {res.status_code} {res.content}"
        user_id = res.json()["id"]

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": original_email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login failed: {res.status_code} {res.content}"

        # Change email
        res = client.put("/api/users/change_email/", data=json.dumps({
            "email": new_email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Change email failed: {res.status_code} {res.content}"

        # Logout
        res = client.post("/api/users/logout")
        assert res.status_code == 200, f"Logout failed: {res.status_code} {res.content}"

        # Login with new email
        res = client.post("/api/users/login", data=json.dumps({
            "email": new_email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200, f"Login with new email failed: {res.status_code} {res.content}"


    # ------------------------------------------------------------------
    # more invalid user flows for changing email
    # ------------------------------------------------------------------
    
    def test_change_email_invalid_format(self, client):
        """
        Should fail when attempting to change email to invalid format
        """
        
        email = "test@example.com"
        password = "Password123"

        # Register
        res = client.post("/api/users/register", data=json.dumps({
            "email": email,
            "password": password,
            "referral_code": None
        }), content_type="application/json")
        assert res.status_code == 200

        # Login
        res = client.post("/api/users/login", data=json.dumps({
            "email": email,
            "password": password
        }), content_type="application/json")
        assert res.status_code == 200

        # Try changing to invalid email format
        res = client.put("/api/users/change_email/", data=json.dumps({
            "email": "not-an-email",
            "password": password
        }), content_type="application/json")
        assert res.status_code == 400

    # ------------------------------------------------------------------
    # expo push notifications - valid
    # ------------------------------------------------------------------

    def test_save_push_token(self, client):
        """
        User can save their Expo push notification token for later use
        """
        
        user = CustomUser.objects.create_user(username="pushtoken", email="pushtoken@example.com", password="Password123")
        client.post("/api/users/login", data=json.dumps({"email": "pushtoken@example.com", "password": "Password123"}), content_type="application/json")
        res = client.post("/api/users/save_push_token", data=json.dumps({"token": "testtoken", "device_id": "device123"}), content_type="application/json")
        assert res.status_code == 200
        
    # ------------------------------------------------------------------
    # referral codes - valid user flow
    # ------------------------------------------------------------------

    def test_validate_referral_code(self, client):
        """
        Valid referral codes should return true from /validate_referral_code
        """
        
        user = CustomUser.objects.create_user(username="referral", email="referral@example.com", password="Password123", referral_code="myrefcode1")
        res = client.get(f"/api/users/validate_referral_code?referral_code=myrefcode1")
        assert res.status_code == 200
        assert res.json()["valid"] is True
        
    # ------------------------------------------------------------------
    # referral codes - invalid user flow
    # ------------------------------------------------------------------
        
        
    def test_validate_invalid_referral_code(self, client):
        """
        Invalid referral codes should return false
        """
        
        user = CustomUser.objects.create_user(username="invalidreferral", email="referral@example.com", password="Password123", referral_code="myrefcode1")
        res = client.get(f"/api/users/validate_referral_code?referral_code=invalidcode")
        assert res.json()["valid"] is False 
        
    # ------------------------------------------------------------------
    # set user city - valid user flow   
    # ------------------------------------------------------------------


    def test_set_user_city(self, client):
        """
        Users can set their city in profile
        """
        
        user = CustomUser.objects.create_user(username="setcity", email="setcity@example.com", password="Password123")
        client.post("/api/users/login", data=json.dumps({"email": "setcity@example.com", "password": "Password123"}), content_type="application/json")
        res = client.post("/api/users/set_user_city", data=json.dumps({"city": "Tel Aviv"}), content_type="application/json")
        assert res.status_code == 200
        
    
        
        

                                                                          
        

