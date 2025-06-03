import pytest
import json
from users.models import CustomUser, Profile
from services.models import Service
from tags.models import Tag

@pytest.mark.django_db
class TestServiceRoutes:
    def _make_user(self, username, email, password):
        user = CustomUser.objects.create_user(username=username, email=email, password=password)
        Profile.objects.create(user=user)
        return user

    def _login(self, client, email, password):
        payload = {"email": email, "password": password}
        res = client.post("/api/users/login", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200

    def _create_service(self, client, tag_name="tag1", title="Test Service", offered_payment=0, is_volunteering=False):
        Tag.objects.create(name=tag_name)
        payload = {
            "title": title,
            "description": "desc",
            "tags": [tag_name],
            "location": "TLV",
            "date_time_range": ["2026-01-01T10:00:00", "2026-01-01T12:00:00"],
            "estimated_duration": "PT2H",
            "offered_payment": offered_payment,
            "service_from": "publisher",
            "is_volunteering": is_volunteering,
        }
        res = client.post("/api/services/create_service", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 200
        return res.json()["id"]
    
    # --------------------------------------
    # Test case 4: Service Management - verify service publishing
    # --------------------------------------

    def test_create_and_get_service(self, client):
        """        
        Use Case 3: Service Management
        Test Case 4: Verify Service Publishing

        This test checks that a user can create a service and then retrieve it.
        """
        
        user = self._make_user("creator", "creator@example.com", "Password123")
        self._login(client, "creator@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.get(f"/api/services/get_service/{service_id}")
        assert res.status_code == 200
        assert res.json()["title"] == "Test Service"
        
        
    # --------------------------------------
    # invalid test case 4: Service Management - Invalid Service Creation
    # --------------------------------------

    def test_create_service_with_missing_fields(self, client):
        """
        Use Case 3: Service Management
        Test Case 4: Verify Service Publishing

        This test checks that a user cannot create a service with missing required fields.
        """
        
        user = self._make_user("badcreator", "bad@example.com", "Password123")
        self._login(client, "bad@example.com", "Password123")
        payload = {
            "description": "desc",
            "tags": ["t1"],
            "location": "TLV",
            "date_time_range": ["2026-01-01T10:00:00", "2026-01-01T12:00:00"],
            "estimated_duration": "PT2H",
        }
        res = client.post("/api/services/create_service", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 422
        
    # --------------------------------------
    # invalid test case 4: Service Management - Conflicting Fields
    # --------------------------------------

    def test_create_service_with_conflicting_fields(self, client):
        """
        Use Case 3: Service Management
        Test Case 4: Verify Service Publishing

        This test checks that a user cannot create a service with conflicting fields (volunteering and payment).
        """
        
        user = self._make_user("conflictuser", "conflict@example.com", "Password123")
        self._login(client, "conflict@example.com", "Password123")
        Tag.objects.create(name="voltag")
        payload = {
            "title": "Bad Flags",
            "description": "desc",
            "tags": ["voltag"],
            "location": "TLV",
            "date_time_range": ["2025-01-01T10:00:00", "2025-01-01T12:00:00"],
            "estimated_duration": "PT1H",
            "offered_payment": 50,
            "service_from": "publisher",
            "is_volunteering": True
        }
        res = client.post("/api/services/create_service", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400
        
    # --------------------------------------
    # test case 5: Service Management - Verify Service Editing (2 fields)
    # --------------------------------------

    def test_update_service_fields(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the name and tags of a service.
        """
        
        user = self._make_user("editfields", "editfields@example.com", "Password123")
        self._login(client, "editfields@example.com", "Password123")
        service_id = self._create_service(client, tag_name="init", title="Field Service", offered_payment=10)

        res = client.post(f"/api/services/update_name/{service_id}?new_data=NewName")
        assert res.status_code == 200
        assert Service.objects.get(id=service_id).title == "NewName"

        Tag.objects.create(name="updated")
        res = client.post(
            f"/api/services/update_tags/{service_id}",
            data=json.dumps(["updated"]),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert "updated" in list(Service.objects.get(id=service_id).tags.values_list("name", flat=True))
        
        
    # --------------------------------------
    # test case 5: Service Management - update fields (seperately)
    # --------------------------------------
        
        
    def test_update_service_title(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the title of a service.
        """
        user = self._make_user("editfields", "editfields@example.com", "Password123")
        self._login(client, "editfields@example.com", "Password123")
        service_id = self._create_service(client, tag_name="init", title="Old Title", offered_payment=10)

        res = client.post(f"/api/services/update_name/{service_id}?new_data=New Title")
        assert res.status_code == 200
        assert Service.objects.get(id=service_id).title == "New Title"
        
    def test_update_service_tags(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the tags of a service.
        """
        user = self._make_user("editfields", "editfields@example.com", "Password123")
        self._login(client, "editfields@example.com", "Password123")
        service_id = self._create_service(client, tag_name="init", title="Field Service", offered_payment=10)

        Tag.objects.create(name="updated")
        res = client.post(
            f"/api/services/update_tags/{service_id}",
            data=json.dumps(["updated"]),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert "updated" in list(Service.objects.get(id=service_id).tags.values_list("name", flat=True))



    def test_update_service_description(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the description of a service.
        """
        user = self._make_user("update_description", "update_description@example.com", "Password123")
        self._login(client, "update_description@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.post(f"/api/services/update_description/{service_id}?new_data=Updated%20description")


        assert res.status_code == 200
        assert Service.objects.get(id=service_id).description == "Updated description"
        
        
    def test_update_service_location(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the location of a service.
        """
        user = self._make_user("update_location", "update_location@example.com", "Password123")
        self._login(client, "update_location@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.post(f"/api/services/update_location/{service_id}?new_data=New%20Location")


        assert res.status_code == 200
        assert Service.objects.get(id=service_id).location == "New Location"
        
        
    def test_update_service_date_time_range(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the date/time range of a service.
        """
        user = self._make_user("update_date_time_range", "update_date_time_range@example.com", "Password123")
        self._login(client, "update_date_time_range@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.post(
            f"/api/services/update_date_time_range/{service_id}",
            data=json.dumps(["2026-02-01T09:00:00", "2026-02-01T11:00:00"]),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert Service.objects.get(id=service_id).date_time_range == ["2026-02-01T09:00:00", "2026-02-01T11:00:00"]
        
        
    def test_update_service_estimated_duration(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the estimated duration of a service.
        """
        user = self._make_user("update_estimated_duration", "update_estimated_duration@example.com", "Password123")
        self._login(client, "update_estimated_duration@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.post(f"/api/services/update_estimated_duration/{service_id}?new_data=PT3H")


        assert res.status_code == 200
        assert Service.objects.get(id=service_id).estimated_duration.total_seconds() == 10800
        
        
    def test_update_service_offered_payment(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that a user can update the offered payment of a job service.
        """
        user = self._make_user("update_payment", "update_payment@example.com", "Password123")
        self._login(client, "update_payment@example.com", "Password123")
        service_id = self._create_service(client, offered_payment=1.0)

        res = client.post(f"/api/services/update_offered_payment/{service_id}?new_data=50.0")


        assert res.status_code == 200
        assert float(Service.objects.get(id=service_id).offered_payment) == 50.0
        
        
    # --------------------------------------
    # invalid test case 5: Service Management - invalid Service Editing
    # --------------------------------------
        
        
    def test_update_service_description_invalid(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing - Invalid

        This test checks that updating description with invalid data fails.
        """
        user = self._make_user("desc_invalid", "desc_invalid@example.com", "Password123")
        self._login(client, "desc_invalid@example.com", "Password123")
        service_id = self._create_service(client)

        res = client.post(f"/api/services/update_description/{service_id}")
        assert res.status_code == 422 

        res = client.post(f"/api/services/update_description/{service_id}?new_data=")
        assert res.status_code == 200
        
        
        
        
        

    def test_update_service_location_invalid(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing - Invalid

        This test checks that updating location with invalid data fails.
        """
        user = self._make_user("loc_invalid", "loc_invalid@example.com", "Password123")
        self._login(client, "loc_invalid@example.com", "Password123")
        service_id = self._create_service(client)

        res = client.post(f"/api/services/update_location/{service_id}")
        assert res.status_code == 422 

    
        
        
    def test_update_service_estimated_duration_invalid(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing - Invalid

        This test checks that updating duration with bad format fails.
        """
        user = self._make_user("duration_invalid", "duration_invalid@example.com", "Password123")
        self._login(client, "duration_invalid@example.com", "Password123")
        service_id = self._create_service(client)

        res = client.post(f"/api/services/update_estimated_duration/{service_id}")
        assert res.status_code == 422 

        res = client.post(f"/api/services/update_estimated_duration/{service_id}?new_data=invalid_duration")
        assert res.status_code == 500
        
        
    def test_update_service_offered_payment_invalid(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing - Invalid

        This test checks that updating offered payment with invalid values fails.
        """
        user = self._make_user("payment_invalid", "payment_invalid@example.com", "Password123")
        self._login(client, "payment_invalid@example.com", "Password123")
        service_id = self._create_service(client)

        #missing new_data
        res = client.post(f"/api/services/update_offered_payment/{service_id}")
        assert res.status_code == 422 

        #non-numeric value
        res = client.post(f"/api/services/update_offered_payment/{service_id}?new_data=abc")
        assert res.status_code == 422



    def test_update_service_date_time_range_invalid(self, client):
            """
            Use Case 3: Service Management
            Test Case 5: Verify Service Editing - Invalid

            This test checks that an invalid date/time range update is rejected.
            """
            user = self._make_user("badtimer", "badtimer@example.com", "Password123")
            self._login(client, "badtimer@example.com", "Password123")
            service_id = self._create_service(client)

            # One datetime only
            res = client.post(
                f"/api/services/update_date_time_range/{service_id}",
                data=json.dumps(["2026-02-01T09:00:00"]),
                content_type="application/json"
            )
            assert res.status_code == 500

            # Invalid format
            res = client.post(
                f"/api/services/update_date_time_range/{service_id}",
                data=json.dumps(["bad-date", "still-bad"]),
                content_type="application/json"
            )
            assert res.status_code == 500



    def test_update_with_invalid_service_id(self, client):
        """
        Use Case 3: Service Management
        Test Case 5: Verify Service Editing

        This test checks that trying to update a service with an invalid ID returns a 404 error.
        """
        
        user = self._make_user("missing", "missing@example.com", "Password123")
        self._login(client, "missing@example.com", "Password123")
        res = client.post("/api/services/update_name/99999?new_data=fail")
        assert res.status_code == 404
        
        
    # --------------------------------------
    # test case 8 : Service Search & Application - verify service application submission
    # --------------------------------------
    
    
    def test_apply_to_service(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 8: Verify Service Application Submission

        This test checks that a user can apply to a service.
        """
        
        creator = self._make_user("creator", "creator@example.com", "Password123")
        applicant = self._make_user("applicant", "applicant@example.com", "Password123")
        self._login(client, "creator@example.com", "Password123")
        service_id = self._create_service(client)

        self._login(client, "applicant@example.com", "Password123")
        res = client.post(f"/api/services/apply_to_service/{service_id}")
        assert res.status_code == 200
        
    # --------------------------------------
    # test case 8 : Service Search & Application - verify service application removal
    # --------------------------------------
        
    def test_remove_from_service(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 8: Verify Service Application Removal

        This test checks that a user can remove themselves from a service.
        """
        
        creator = self._make_user("creator", "creator@example.com", "Password123")
        applicant = self._make_user("applicant", "applicant@example.com", "Password123")
        self._login(client, "creator@example.com", "Password123")
        service_id = self._create_service(client)

        self._login(client, "applicant@example.com", "Password123")
        client.post(f"/api/services/apply_to_service/{service_id}")
        res = client.post(f"/api/services/remove_from_service/{service_id}")
        assert res.status_code == 200
        
    
    # --------------------------------------
    # test case 8 : Service Search & Application - verify service application submission and removal
    # --------------------------------------

    def test_apply_and_remove_from_service(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 8: Verify Service Application Submission

        This test checks that a user can apply to a service and then remove themselves from it.
        """
        
        creator = self._make_user("creator", "creator@example.com", "Password123")
        applicant = self._make_user("applicant", "applicant@example.com", "Password123")
        self._login(client, "creator@example.com", "Password123")
        service_id = self._create_service(client, tag_name="app", title="Apply Service")

        self._login(client, "applicant@example.com", "Password123")
        res = client.post(f"/api/services/apply_to_service/{service_id}")
        assert res.status_code == 200
        res = client.post(f"/api/services/remove_from_service/{service_id}")
        assert res.status_code == 200
        
    # --------------------------------------
    # invalid test case 8 : Service Search & Application - verify service application submission to own service is not allowed

    def test_apply_to_own_service_fails(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 8: Verify Service Application Submission

        This test checks that a user cannot apply to their own service.
        """
        
        user = self._make_user("selfapply", "selfapply@example.com", "Password123")
        self._login(client, "selfapply@example.com", "Password123")
        service_id = self._create_service(client, tag_name="sapply")
        res = client.post(f"/api/services/apply_to_service/{service_id}")
        assert res.status_code == 400


    # --------------------------------------
    # Use Case 4: Service Search & Application - Search and Completion
    # --------------------------------------
    
    
    def test_mark_service_completed(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 7: Verify Service Completion

        This test checks that a user can mark a service as completed.
        """
        user = self._make_user("marker", "marker@example.com", "Password123")
        self._login(client, "marker@example.com", "Password123")
        service_id = self._create_service(client)
        res = client.post(f"/api/services/mark_service_completed/{service_id}")
        assert res.status_code == 200
        
    
        
    def test_search_completed_services(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 7: Verify Service Search Functionality

        This test checks that a completed service appears in the search results.
        """
        user = self._make_user("searcher", "searcher@example.com", "Password123")
        self._login(client, "searcher@example.com", "Password123")
        service_id = self._create_service(client, tag_name="searchtag", title="Search Service")
        client.post(f"/api/services/mark_service_completed/{service_id}")

        search_payload = {"location": "TLV", "tags": ["searchtag"]}
        res = client.post(
            "/api/services/search_completed_services",
            data=json.dumps(search_payload),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert any(s["id"] == service_id for s in res.json())
        

    # --------------------------------------
    # test case 7: Service Search & Application - verify service search functionality
    # --------------------------------------
    def test_search_services(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 7: Verify Service Search Functionality

        This test checks that a user can search for services based on location and tags.
        """
        
        user = self._make_user("searcher", "searcher@example.com", "Password123")
        self._login(client, "searcher@example.com", "Password123")
        service_id = self._create_service(client, tag_name="searchtag", title="Search Service")  
        
        search_payload = {"location": "TLV", "tags": ["searchtag"]}
        res = client.post(
            "/api/services/search_needed_services",
            data=json.dumps(search_payload),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert any(s["id"] == service_id for s in res.json())
        

        
        
        
              
    # --------------------------------------
    # Use Case 3: Service Management - Save and Unsave
    # --------------------------------------

    def test_save_and_unsave_service(self, client):
        """
        this test checks that a user can save and unsave a service
        """
        
        user = self._make_user("saveuser", "saveuser@example.com", "Password123")
        self._login(client, "saveuser@example.com", "Password123")
        service_id = self._create_service(client, tag_name="saveme", title="Save Service")
        res = client.get(f"/api/services/save_service/{service_id}")
        assert res.status_code == 200
        res = client.get(f"/api/services/unsave_service/{service_id}")
        assert res.status_code == 200
        
        
    # --------------------------------------
    # test case 6: Service Management - verify service deletion
    # --------------------------------------

    def test_delete_service(self, client):
        """
        Use Case 3: Service Management
        Test Case 6: Verify Service Deletion

        This test checks that a user can delete their own service.
        """
        
        user = self._make_user("deleteuser", "deleteuser@example.com", "Password123")
        self._login(client, "deleteuser@example.com", "Password123")
        service_id = self._create_service(client, tag_name="del", title="Delete Service")
        res = client.delete(f"/api/services/delete_service/{service_id}")
        assert res.status_code == 200
        assert not Service.objects.filter(id=service_id).exists()
        
    # --------------------------------------
    # test case 6: Service Management - verify service deletion by non-owner
    # --------------------------------------

    def test_delete_service_as_non_owner_fails(self, client):
        """
        Use Case 3: Service Management
        Test Case 6: Verify Service Deletion

        This test checks that a user who is not the owner of a service cannot delete it.
        """
        
        owner = self._make_user("ownr", "ownr@example.com", "Password123")
        other = self._make_user("othr", "othr@example.com", "Password123")
        self._login(client, "ownr@example.com", "Password123")
        service_id = self._create_service(client, tag_name="faildel")
        self._login(client, "othr@example.com", "Password123")
        res = client.delete(f"/api/services/delete_service/{service_id}")
        assert res.status_code == 403
        
        
    # --------------------------------------
    # test case 9: Service Search & Application - Accept Applicants
    # --------------------------------------
    
    def test_accept_applicant(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 9: Verify Acceptance of a Service Applicant

        This test checks that a creator can accept an applicant for their service.
        """
        creator = self._make_user("cuser", "cuser@example.com", "Password123")
        applicant = self._make_user("auser", "auser@example.com", "Password123")
        self._login(client, "cuser@example.com", "Password123")
        service_id = self._create_service(client)

        self._login(client, "auser@example.com", "Password123")
        client.post(f"/api/services/apply_to_service/{service_id}")

        self._login(client, "cuser@example.com", "Password123")
        res = client.post(f"/api/services/accept_applicant/{service_id}/{applicant.id}")
        assert res.status_code == 200
        
    # --------------------------------------
    # test case 9: Service Search & Application - Reject Applicants
    # --------------------------------------
        
    def test_reject_applicant(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 9: Verify Rejection of a Service Applicant

        This test checks that a creator can reject an applicant for their service.
        """
        creator = self._make_user("cuser", "cuser@example.com", "Password123")
        applicant = self._make_user("auser", "auser@example.com", "Password123")
        self._login(client, "cuser@example.com", "Password123")
        service_id = self._create_service(client)

        self._login(client, "auser@example.com", "Password123")
        client.post(f"/api/services/apply_to_service/{service_id}")

        self._login(client, "cuser@example.com", "Password123")
        res = client.post(f"/api/services/reject_applicant/{service_id}/{applicant.id}")
        assert res.status_code == 200
        
        
    

    def test_accept_and_reject_applicant(self, client):
        """
        Use Case 4: Service Search & Application
        Test Case 9: Verify Acceptance of a Service Applicant

        This test checks that a creator can accept and reject an applicant for their service.
        """
        
        creator = self._make_user("cuser", "cuser@example.com", "Password123")
        applicant = self._make_user("auser", "auser@example.com", "Password123")
        self._login(client, "cuser@example.com", "Password123")
        service_id = self._create_service(client, tag_name="apprj", title="AccRej Service")
        self._login(client, "auser@example.com", "Password123")
        client.post(f"/api/services/apply_to_service/{service_id}")
        self._login(client, "cuser@example.com", "Password123")
        client.post(f"/api/services/accept_applicant/{service_id}/{applicant.id}")
        res = client.post(f"/api/services/reject_applicant/{service_id}/{applicant.id}")
        assert res.status_code == 200

    def test_get_nonexistent_service(self, client):
        """
        this test checks that trying to get a service that does not exist returns a 404 error
        """
        user = self._make_user("ghost", "ghost@example.com", "Password123")
        self._login(client, "ghost@example.com", "Password123")
        res = client.get("/api/services/get_service/999999")
        assert res.status_code == 404
        
  
  
  
   