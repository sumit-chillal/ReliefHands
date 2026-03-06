#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  ReliefHands Platform Enhancement - Add missing features and fix issues:
  1. Fix email notifications (SendGrid configured)
  2. Add Google OAuth integration (Sign in with Google)
  3. Add Maps functionality to find nearby NGOs with navigation
  4. Fix navigation issues - allow logged-in users to view landing page
  5. Fix "Start your journey" button functionality
  6. Update certificate design to match floral template
  7. Add campaign image upload feature for NGOs
  8. Add dummy NGOs and volunteers with credentials
  9. Add filter functionality for campaigns and NGOs
  10. Add emergency campaign highlighting (red border + badge + priority sorting)
  11. Add past works view for NGOs and volunteers
  12. Add "Maps" to navbar for all users

backend:
  - task: "Google OAuth Integration"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added /api/auth/google endpoint that verifies Google token and creates/logs in user"

  - task: "Campaign Image Upload"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added /api/ngo/campaigns/{campaign_id}/upload-images endpoint with multipart file upload support"

  - task: "Emergency Campaign Flag and Admin Approval"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added isEmergency and emergencyApproved fields to campaigns. Added /api/admin/campaigns/{campaign_id}/approve-emergency endpoint"

  - task: "NGO Location Fields and Maps"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added latitude, longitude, address to NGO model. Created /api/maps/nearby-ngos and /api/maps/directions endpoints"

  - task: "Filter Endpoints for Campaigns and NGOs"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Updated /api/volunteer/campaigns with query params (emergency_only, location, ngo_id). Emergency campaigns sorted to top"

  - task: "Past Works Endpoints"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added /api/volunteer/past-campaigns and /api/ngo/past-campaigns endpoints"

  - task: "Certificate Design Update"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Updated certificate PDF generation with floral border design using teal/turquoise and orange/yellow colors matching the provided image"

  - task: "Dummy Data Seeding"
    implemented: true
    working: true
    file: "backend/seed_data.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created seed script with 8 NGOs, 15 volunteers, 20 campaigns including emergency campaigns. Credentials saved to dummy_credentials.json"

  - task: "Static File Serving for Uploads"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Mounted /uploads directory for serving campaign and NGO images"

frontend:
  - task: "Google OAuth Integration"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/LandingPage.js, frontend/src/context/AuthContext.js, frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Added GoogleOAuthProvider wrapper and Google Sign-In buttons in login and volunteer registration tabs"

  - task: "Maps Page"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/MapsPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Created MapsPage with Google Maps integration, nearby NGO markers, and navigation functionality"

  - task: "Navigation Fixes"
    implemented: true
    working: "NA"
    file: "frontend/src/pages/LandingPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Removed auto-redirect for logged-in users. Added 'Go to Dashboard' button in header when logged in. Added 'Find NGOs' link to Maps page"

  - task: "Dashboard Updates - Campaign Images"
    implemented: false
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "NOT YET IMPLEMENTED - Need to add image upload UI in NGO dashboard and display images in campaign cards"

  - task: "Emergency Campaign Highlighting"
    implemented: false
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "NOT YET IMPLEMENTED - Need to add emergency checkbox in campaign creation and style emergency campaigns with red border + badge"

  - task: "Filter UI"
    implemented: false
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "NOT YET IMPLEMENTED - Need to add filter dropdowns in dashboards"

  - task: "Past Works UI"
    implemented: false
    working: "NA"
    file: "NA"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "NOT YET IMPLEMENTED - Need to add Past Works tab in NGO and Volunteer dashboards"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Google OAuth Integration"
    - "Campaign Image Upload"
    - "Emergency Campaign Flag and Admin Approval"
    - "NGO Location Fields and Maps"
    - "Filter Endpoints for Campaigns and NGOs"
    - "Past Works Endpoints"
    - "Certificate Design Update"
    - "Dummy Data Seeding"
    - "Static File Serving for Uploads"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Backend implementation completed for Phase 1:
      - ✅ Google OAuth endpoint with token verification
      - ✅ Campaign image upload with multipart support
      - ✅ Emergency campaign flag with admin approval workflow
      - ✅ NGO location fields (lat, lng, address)
      - ✅ Maps endpoints: nearby NGOs (Haversine distance) and directions (OpenRouteService)
      - ✅ Campaign/NGO filters with query parameters
      - ✅ Past works endpoints for volunteers and NGOs
      - ✅ Certificate design updated with floral border (teal/orange colors)
      - ✅ Seed data script created with 8 NGOs, 15 volunteers, 20 campaigns
      - ✅ Static file serving for /uploads
      
      Frontend implementation partial (Phase 1):
      - ✅ Google OAuth UI components added
      - ✅ Maps page created with Google Maps
      - ✅ Navigation fixes applied
      - ⏳ Dashboard updates for images, emergency highlighting, filters, past works - NOT YET DONE
      
      Next: Test all backend endpoints, then continue with remaining frontend features.