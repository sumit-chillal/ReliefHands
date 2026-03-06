import requests
import sys
import json
from datetime import datetime, timedelta

class ReliefHandsAPITester:
    def __init__(self, base_url="http://localhost:8001/api"):
        self.base_url = base_url
        self.admin_token = None
        self.volunteer_token = None
        self.ngo_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Use provided credentials from review request
        self.admin_creds = {"email": "admin@reliefhands.org", "password": "Admin@123"}
        self.ngo_creds = {"email": "contact@greenearthfoundation.org", "password": "GreenEarth@123"}
        self.volunteer_creds = {"email": "sarah.johnson@email.com", "password": "Sarah@123"}
        
        # Test data for new features
        self.test_volunteer = {
            "name": f"Test Volunteer {datetime.now().strftime('%H%M%S')}",
            "email": f"volunteer_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!"
        }
        
        self.test_ngo = {
            "ngoName": f"Test NGO {datetime.now().strftime('%H%M%S')}",
            "registrationId": f"NGO{datetime.now().strftime('%H%M%S')}",
            "email": f"ngo_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "mission": "Test mission for automated testing",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "address": "San Francisco, CA"
        }
        
        self.created_volunteer_id = None
        self.created_ngo_id = None
        self.created_campaign_id = None
        self.created_request_id = None
        self.emergency_campaign_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({
                    "test": name,
                    "status": "PASSED",
                    "expected": expected_status,
                    "actual": response.status_code,
                    "description": description
                })
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.test_results.append({
                    "test": name,
                    "status": "FAILED",
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text,
                    "description": description
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "error": str(e),
                "description": description
            })
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.admin_creds,
            description="Login with admin credentials"
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_existing_ngo_login(self):
        """Test existing NGO login"""
        success, response = self.run_test(
            "Existing NGO Login",
            "POST",
            "auth/login",
            200,
            data=self.ngo_creds,
            description="Login with existing NGO credentials"
        )
        if success and 'token' in response:
            self.ngo_token = response['token']
            print(f"   NGO token obtained: {self.ngo_token[:20]}...")
            return True
        return False

    def test_existing_volunteer_login(self):
        """Test existing volunteer login"""
        success, response = self.run_test(
            "Existing Volunteer Login",
            "POST",
            "auth/login",
            200,
            data=self.volunteer_creds,
            description="Login with existing volunteer credentials"
        )
        if success and 'token' in response:
            self.volunteer_token = response['token']
            print(f"   Volunteer token obtained: {self.volunteer_token[:20]}...")
            return True
        return False

    def test_volunteer_registration(self):
        """Test volunteer registration"""
        success, response = self.run_test(
            "Volunteer Registration",
            "POST",
            "auth/register-volunteer",
            200,
            data=self.test_volunteer,
            description="Register new volunteer account"
        )
        if success and 'token' in response:
            self.volunteer_token = response['token']
            if 'user' in response:
                self.created_volunteer_id = response['user']['id']
            print(f"   Volunteer registered with ID: {self.created_volunteer_id}")
            return True
        return False

    def test_ngo_registration(self):
        """Test NGO registration"""
        success, response = self.run_test(
            "NGO Registration",
            "POST",
            "auth/register-ngo",
            200,
            data=self.test_ngo,
            description="Register new NGO account"
        )
        if success and 'token' in response:
            self.ngo_token = response['token']
            if 'ngo' in response:
                self.created_ngo_id = response['ngo']['id']
            print(f"   NGO registered with ID: {self.created_ngo_id}")
            return True
        return False

    def test_volunteer_login(self):
        """Test volunteer login"""
        success, response = self.run_test(
            "Volunteer Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_volunteer["email"], "password": self.test_volunteer["password"]},
            description="Login with volunteer credentials"
        )
        return success

    def test_ngo_login(self):
        """Test NGO login"""
        success, response = self.run_test(
            "NGO Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_ngo["email"], "password": self.test_ngo["password"]},
            description="Login with NGO credentials"
        )
        return success

    def test_admin_get_volunteers(self):
        """Test admin getting all volunteers"""
        success, response = self.run_test(
            "Admin Get Volunteers",
            "GET",
            "admin/volunteers",
            200,
            token=self.admin_token,
            description="Admin retrieves list of all volunteers"
        )
        return success

    def test_admin_get_ngos(self):
        """Test admin getting all NGOs"""
        success, response = self.run_test(
            "Admin Get NGOs",
            "GET",
            "admin/ngos",
            200,
            token=self.admin_token,
            description="Admin retrieves list of all NGOs"
        )
        return success

    def test_admin_verify_volunteer(self):
        """Test admin verifying volunteer"""
        if not self.created_volunteer_id:
            print("❌ Skipping volunteer verification - no volunteer ID")
            return False
            
        success, response = self.run_test(
            "Admin Verify Volunteer",
            "PUT",
            f"admin/verify-volunteer/{self.created_volunteer_id}",
            200,
            data={"status": "Approved"},
            token=self.admin_token,
            description="Admin approves volunteer account"
        )
        return success

    def test_admin_verify_ngo(self):
        """Test admin verifying NGO"""
        if not self.created_ngo_id:
            print("❌ Skipping NGO verification - no NGO ID")
            return False
            
        success, response = self.run_test(
            "Admin Verify NGO",
            "PUT",
            f"admin/verify-ngo/{self.created_ngo_id}",
            200,
            data={"status": "Approved"},
            token=self.admin_token,
            description="Admin approves NGO account"
        )
        return success

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        success, response = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            token=self.admin_token,
            description="Admin retrieves platform analytics"
        )
        return success

    def test_ngo_create_campaign(self):
        """Test NGO creating campaign"""
        campaign_data = {
            "title": f"Test Campaign {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test campaign for automated testing",
            "location": "Test City, Test State",
            "startDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
            "volunteersNeeded": 5
        }
        
        success, response = self.run_test(
            "NGO Create Campaign",
            "POST",
            "ngo/campaigns",
            200,
            data=campaign_data,
            token=self.ngo_token,
            description="NGO creates new campaign"
        )
        if success and 'id' in response:
            self.created_campaign_id = response['id']
            print(f"   Campaign created with ID: {self.created_campaign_id}")
        return success

    def test_ngo_get_campaigns(self):
        """Test NGO getting their campaigns"""
        success, response = self.run_test(
            "NGO Get Campaigns",
            "GET",
            "ngo/campaigns",
            200,
            token=self.ngo_token,
            description="NGO retrieves their campaigns"
        )
        return success

    def test_volunteer_get_campaigns(self):
        """Test volunteer getting available campaigns"""
        success, response = self.run_test(
            "Volunteer Get Campaigns",
            "GET",
            "volunteer/campaigns",
            200,
            description="Volunteer retrieves available campaigns"
        )
        return success

    def test_volunteer_apply_campaign(self):
        """Test volunteer applying to campaign"""
        if not self.created_campaign_id:
            print("❌ Skipping volunteer application - no campaign ID")
            return False
            
        success, response = self.run_test(
            "Volunteer Apply Campaign",
            "POST",
            "volunteer/requests",
            200,
            data={"campaignId": self.created_campaign_id},
            token=self.volunteer_token,
            description="Volunteer applies to campaign"
        )
        if success and 'id' in response:
            self.created_request_id = response['id']
            print(f"   Request created with ID: {self.created_request_id}")
        return success

    def test_ngo_get_requests(self):
        """Test NGO getting volunteer requests"""
        success, response = self.run_test(
            "NGO Get Requests",
            "GET",
            "ngo/requests",
            200,
            token=self.ngo_token,
            description="NGO retrieves volunteer requests"
        )
        return success

    def test_ngo_approve_request(self):
        """Test NGO approving volunteer request"""
        if not self.created_request_id:
            print("❌ Skipping request approval - no request ID")
            return False
            
        success, response = self.run_test(
            "NGO Approve Request",
            "PUT",
            f"ngo/requests/{self.created_request_id}",
            200,
            data={"status": "Approved"},
            token=self.ngo_token,
            description="NGO approves volunteer request"
        )
        return success

    def test_volunteer_get_requests(self):
        """Test volunteer getting their requests"""
        success, response = self.run_test(
            "Volunteer Get Requests",
            "GET",
            "volunteer/requests",
            200,
            token=self.volunteer_token,
            description="Volunteer retrieves their applications"
        )
        return success

    def test_ngo_complete_campaign(self):
        """Test NGO completing campaign"""
        if not self.created_campaign_id:
            print("❌ Skipping campaign completion - no campaign ID")
            return False
            
        success, response = self.run_test(
            "NGO Complete Campaign",
            "PUT",
            f"ngo/campaigns/{self.created_campaign_id}/complete",
            200,
            token=self.ngo_token,
            description="NGO marks campaign as completed"
        )
        return success

    def test_volunteer_get_certificates(self):
        """Test volunteer getting certificates"""
        success, response = self.run_test(
            "Volunteer Get Certificates",
            "GET",
            "volunteer/certificates",
            200,
            token=self.volunteer_token,
            description="Volunteer retrieves their certificates"
        )
        return success

    def test_auth_me_endpoints(self):
        """Test /auth/me endpoint for different user types"""
        # Test admin
        success, response = self.run_test(
            "Admin Auth Me",
            "GET",
            "auth/me",
            200,
            token=self.admin_token,
            description="Admin checks their profile"
        )
        
        # Test volunteer
        success, response = self.run_test(
            "Volunteer Auth Me",
            "GET",
            "auth/me",
            200,
            token=self.volunteer_token,
            description="Volunteer checks their profile"
        )
        
        # Test NGO
        success, response = self.run_test(
            "NGO Auth Me",
            "GET",
            "auth/me",
            200,
            token=self.ngo_token,
            description="NGO checks their profile"
        )

    def test_google_oauth(self):
        """Test Google OAuth endpoint (expected to fail without valid token)"""
        success, response = self.run_test(
            "Google OAuth Integration",
            "POST",
            "auth/google",
            401,  # Expected to fail without valid Google token
            data={"token": "invalid_google_token"},
            description="Test Google OAuth endpoint (expected to fail without valid token)"
        )
        return success

    def test_emergency_campaign_creation(self):
        """Test creating emergency campaign"""
        if not self.ngo_token:
            print("❌ Skipping emergency campaign creation - no NGO token")
            return False
            
        campaign_data = {
            "title": f"Emergency Relief Campaign {datetime.now().strftime('%H%M%S')}",
            "description": "Urgent disaster relief campaign for automated testing",
            "location": "San Francisco, CA",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "startDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "endDate": (datetime.now() + timedelta(days=30)).isoformat(),
            "volunteersNeeded": 10,
            "isEmergency": True
        }
        
        success, response = self.run_test(
            "NGO Create Emergency Campaign",
            "POST",
            "ngo/campaigns",
            200,
            data=campaign_data,
            token=self.ngo_token,
            description="NGO creates emergency campaign"
        )
        if success and 'id' in response:
            self.emergency_campaign_id = response['id']
            print(f"   Emergency campaign created with ID: {self.emergency_campaign_id}")
        return success

    def test_campaign_image_upload(self):
        """Test campaign image upload endpoint (simulated)"""
        if not self.emergency_campaign_id:
            print("❌ Skipping image upload - no emergency campaign ID")
            return False
            
        # Note: This will test the endpoint structure but won't actually upload files
        # as we don't have multipart file upload capability in this test framework
        print("🔍 Testing Campaign Image Upload...")
        print("   Note: Actual file upload testing requires multipart form data")
        print("   Testing endpoint availability and authentication only")
        
        # Test with no files (should fail appropriately)
        url = f"{self.base_url}/ngo/campaigns/{self.emergency_campaign_id}/upload-images"
        headers = {'Authorization': f'Bearer {self.ngo_token}'}
        
        try:
            response = requests.post(url, headers=headers)
            if response.status_code in [400, 422]:  # Expected for missing files
                print("✅ Image upload endpoint accessible and validates input")
                self.tests_run += 1
                self.tests_passed += 1
                self.test_results.append({
                    "test": "Campaign Image Upload Endpoint",
                    "status": "PASSED",
                    "description": "Endpoint accessible, validates missing files appropriately"
                })
                return True
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error testing image upload: {str(e)}")
            return False

    def test_admin_campaigns_list(self):
        """Test admin getting all campaigns"""
        success, response = self.run_test(
            "Admin Get All Campaigns",
            "GET",
            "admin/campaigns",
            200,
            token=self.admin_token,
            description="Admin retrieves all campaigns for approval"
        )
        return success

    def test_emergency_campaign_approval(self):
        """Test admin approving emergency campaign"""
        if not self.emergency_campaign_id:
            print("❌ Skipping emergency approval - no emergency campaign ID")
            return False
            
        success, response = self.run_test(
            "Admin Approve Emergency Campaign",
            "PUT",
            f"admin/campaigns/{self.emergency_campaign_id}/approve-emergency",
            200,
            data={"emergencyApproved": True},
            token=self.admin_token,
            description="Admin approves emergency campaign status"
        )
        return success

    def test_maps_nearby_ngos(self):
        """Test nearby NGOs endpoint"""
        success, response = self.run_test(
            "Maps Nearby NGOs",
            "GET",
            "maps/nearby-ngos?latitude=37.7749&longitude=-122.4194&radius_km=50",
            200,
            description="Get nearby NGOs using sample San Francisco coordinates"
        )
        return success

    def test_maps_directions(self):
        """Test directions endpoint"""
        success, response = self.run_test(
            "Maps Directions",
            "GET",
            "maps/directions?start_lat=37.7749&start_lng=-122.4194&end_lat=37.7849&end_lng=-122.4094",
            200,
            description="Get directions between two points in San Francisco"
        )
        return success

    def test_campaign_filters(self):
        """Test campaign filtering functionality"""
        # Test emergency only filter
        success1, response1 = self.run_test(
            "Campaign Filter - Emergency Only",
            "GET",
            "volunteer/campaigns?emergency_only=true",
            200,
            description="Filter campaigns to show only emergency campaigns"
        )
        
        # Test location filter
        success2, response2 = self.run_test(
            "Campaign Filter - Location",
            "GET",
            "volunteer/campaigns?location=San Francisco",
            200,
            description="Filter campaigns by location"
        )
        
        return success1 and success2

    def test_past_campaigns_volunteer(self):
        """Test volunteer past campaigns endpoint"""
        success, response = self.run_test(
            "Volunteer Past Campaigns",
            "GET",
            "volunteer/past-campaigns",
            200,
            token=self.volunteer_token,
            description="Volunteer retrieves their past completed campaigns"
        )
        return success

    def test_past_campaigns_ngo(self):
        """Test NGO past campaigns endpoint"""
        success, response = self.run_test(
            "NGO Past Campaigns",
            "GET",
            "ngo/past-campaigns",
            200,
            token=self.ngo_token,
            description="NGO retrieves their past completed campaigns"
        )
        return success

def main():
    print("🚀 Starting Relief Hands API Testing...")
    print("=" * 60)
    
    tester = ReliefHandsAPITester()
    
    # Test sequence - focusing on newly implemented features as per review request
    tests = [
        # Authentication tests with existing accounts
        ("Admin Login", tester.test_admin_login),
        ("Existing NGO Login", tester.test_existing_ngo_login),
        ("Existing Volunteer Login", tester.test_existing_volunteer_login),
        
        # Priority 1: Google OAuth Integration
        ("Google OAuth Integration", tester.test_google_oauth),
        
        # Priority 2: Emergency Campaign Creation and Image Upload
        ("NGO Create Emergency Campaign", tester.test_emergency_campaign_creation),
        ("Campaign Image Upload", tester.test_campaign_image_upload),
        
        # Priority 3: Emergency Campaign Approval
        ("Admin Get All Campaigns", tester.test_admin_campaigns_list),
        ("Admin Approve Emergency Campaign", tester.test_emergency_campaign_approval),
        
        # Priority 4 & 5: Maps functionality
        ("Maps Nearby NGOs", tester.test_maps_nearby_ngos),
        ("Maps Directions", tester.test_maps_directions),
        
        # Priority 6: Campaign Filters
        ("Campaign Filters", tester.test_campaign_filters),
        
        # Priority 7: Past Works
        ("Volunteer Past Campaigns", tester.test_past_campaigns_volunteer),
        ("NGO Past Campaigns", tester.test_past_campaigns_ngo),
        
        # Additional core functionality tests
        ("Volunteer Get Campaigns", tester.test_volunteer_get_campaigns),
        ("Admin Analytics", tester.test_admin_analytics),
        ("Auth Me Endpoints", tester.test_auth_me_endpoints),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.test_results.append({
                "test": test_name,
                "status": "ERROR",
                "error": str(e)
            })
    
    # Print summary
    print("\n" + "=" * 60)
    print(f"📊 Test Results Summary:")
    print(f"   Total tests: {tester.tests_run}")
    print(f"   Passed: {tester.tests_passed}")
    print(f"   Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if t['status'] != 'PASSED']
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['test']}: {test.get('error', 'Status mismatch')}")
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed': tester.tests_passed,
                'failed': tester.tests_run - tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
            },
            'test_results': tester.test_results,
            'test_data': {
                'volunteer_id': tester.created_volunteer_id,
                'ngo_id': tester.created_ngo_id,
                'campaign_id': tester.created_campaign_id,
                'request_id': tester.created_request_id
            }
        }, f, indent=2)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())