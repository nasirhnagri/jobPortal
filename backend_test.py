import requests
import sys
import json
from datetime import datetime

class JobNexusAPITester:
    def __init__(self, base_url="https://role-job-portal.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.employer_token = None
        self.candidate_token = None
        self.subadmin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test super admin login
        admin_response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@jobconnect.com", "password": "Admin@123"}
        )
        
        if admin_response and 'token' in admin_response:
            self.admin_token = admin_response['token']
            self.log_test("Admin Token Retrieved", True, "Token stored for subsequent tests")
        else:
            self.log_test("Admin Token Retrieved", False, "Failed to get admin token")
            return False

        # Test candidate registration
        candidate_data = {
            "name": "Test Candidate",
            "email": f"candidate_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "candidate"
        }
        
        candidate_response = self.run_test(
            "Candidate Registration",
            "POST",
            "auth/register",
            200,
            data=candidate_data
        )
        
        if candidate_response and 'token' in candidate_response:
            self.candidate_token = candidate_response['token']
            
        # Test employer registration
        employer_data = {
            "name": "Test Employer",
            "email": f"employer_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "role": "employer"
        }
        
        employer_response = self.run_test(
            "Employer Registration",
            "POST",
            "auth/register",
            200,
            data=employer_data
        )
        
        if employer_response and 'token' in employer_response:
            self.employer_token = employer_response['token']
            self.employer_id = employer_response['user']['id']

        # Test /auth/me endpoint
        self.run_test(
            "Get Current User (Admin)",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )

        return True

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin Endpoints", False, "No admin token available")
            return
        
        # Test analytics
        self.run_test(
            "Get Analytics",
            "GET",
            "admin/analytics",
            200,
            token=self.admin_token
        )
        
        # Test get all users
        self.run_test(
            "Get All Users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        
        # Test pending employers
        self.run_test(
            "Get Pending Employers",
            "GET",
            "admin/employers/pending",
            200,
            token=self.admin_token
        )
        
        # Test pending jobs
        self.run_test(
            "Get Pending Jobs",
            "GET",
            "admin/jobs/pending",
            200,
            token=self.admin_token
        )
        
        # Test approve employer if we have one
        if hasattr(self, 'employer_id'):
            self.run_test(
                "Approve Employer",
                "PUT",
                f"admin/employer/{self.employer_id}/approve",
                200,
                token=self.admin_token
            )

        # Test create sub-admin
        subadmin_data = {
            "name": "Test SubAdmin",
            "email": f"subadmin_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "permissions": ["MANAGE_JOBS", "APPROVE_EMPLOYERS"]
        }
        
        subadmin_response = self.run_test(
            "Create Sub-Admin",
            "POST",
            "admin/create-subadmin",
            200,
            data=subadmin_data,
            token=self.admin_token
        )
        
        # Test get sub-admins
        self.run_test(
            "Get Sub-Admins",
            "GET",
            "admin/subadmins",
            200,
            token=self.admin_token
        )

    def test_employer_endpoints(self):
        """Test employer-specific endpoints"""
        print("\n🏢 Testing Employer Endpoints...")
        
        if not self.employer_token:
            self.log_test("Employer Endpoints", False, "No employer token available")
            return
        
        # Test get employer profile
        self.run_test(
            "Get Employer Profile",
            "GET",
            "employer/profile",
            200,
            token=self.employer_token
        )
        
        # Test update employer profile
        profile_data = {
            "company_name": "Test Company Inc",
            "company_description": "A test company for API testing",
            "company_location": "Test City",
            "company_size": "10-50"
        }
        
        self.run_test(
            "Update Employer Profile",
            "PUT",
            "employer/profile",
            200,
            data=profile_data,
            token=self.employer_token
        )
        
        # Test create job (should work after employer approval)
        job_data = {
            "title": "Test Software Engineer",
            "description": "A test job posting for API testing",
            "company": "Test Company Inc",
            "location": "Remote",
            "salary": "$80,000 - $120,000",
            "job_type": "full-time",
            "experience_level": "mid-level",
            "skills": ["Python", "JavaScript", "React"]
        }
        
        job_response = self.run_test(
            "Create Job Posting",
            "POST",
            "employer/jobs",
            200,
            data=job_data,
            token=self.employer_token
        )
        
        # Test get employer jobs
        self.run_test(
            "Get Employer Jobs",
            "GET",
            "employer/jobs",
            200,
            token=self.employer_token
        )

    def test_candidate_endpoints(self):
        """Test candidate-specific endpoints"""
        print("\n👤 Testing Candidate Endpoints...")
        
        if not self.candidate_token:
            self.log_test("Candidate Endpoints", False, "No candidate token available")
            return
        
        # Test get candidate profile
        self.run_test(
            "Get Candidate Profile",
            "GET",
            "candidate/profile",
            200,
            token=self.candidate_token
        )
        
        # Test update candidate profile
        profile_data = {
            "headline": "Software Engineer",
            "summary": "Experienced developer with 5+ years",
            "skills": ["Python", "JavaScript", "React", "Node.js"],
            "experience": "5+ years",
            "education": "Bachelor's in Computer Science",
            "location": "San Francisco, CA"
        }
        
        self.run_test(
            "Update Candidate Profile",
            "PUT",
            "candidate/profile",
            200,
            data=profile_data,
            token=self.candidate_token
        )
        
        # Test get candidate applications
        self.run_test(
            "Get Candidate Applications",
            "GET",
            "candidate/applications",
            200,
            token=self.candidate_token
        )

    def test_public_endpoints(self):
        """Test public endpoints"""
        print("\n🌐 Testing Public Endpoints...")
        
        # Test root endpoint
        self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        
        # Test get public jobs
        self.run_test(
            "Get Public Jobs",
            "GET",
            "jobs",
            200
        )
        
        # Test job search with parameters
        self.run_test(
            "Search Jobs with Query",
            "GET",
            "jobs?search=engineer&location=remote",
            200
        )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting JobNexus API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run test suites in order
        if self.test_auth_flow():
            self.test_admin_endpoints()
            self.test_employer_endpoints()
            self.test_candidate_endpoints()
        
        self.test_public_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = JobNexusAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': tester.tests_passed/tester.tests_run*100 if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())