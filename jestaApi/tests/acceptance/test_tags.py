import pytest
import json
from tags.models import Tag, Category, SpecialistTag

@pytest.mark.django_db
class TestTagRoutes:


    def test_add_tag(self, client):
        """
        Should allow adding a tag to a category.
        """
        
        cat_res = client.post(
            "/api/tags/add_category",
            data=json.dumps({"name": "General"}),
            content_type="application/json"
        )
        assert cat_res.status_code == 201
        cat_id = cat_res.json()["id"]

        payload = {"name": "helpful", "category_id": cat_id}
        res = client.post(
            "/api/tags/add_tag",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "helpful"
        assert Tag.objects.filter(name="helpful").exists()

        cat = Category.objects.get(id=cat_id)
        assert cat.tags.filter(name="helpful").exists()


    def test_add_tag_missing_fields(self, client):
        """
        Should return 422 if required fields are missing.
        """
        
        res = client.post(
            "/api/tags/add_tag",
            data=json.dumps({}),
            content_type="application/json"
        )
        assert res.status_code == 422

    def test_add_tag_invalid_category(self, client):
        """
        Should return 404 if category ID does not exist.
        """
        
        res = client.post(
            "/api/tags/add_tag",
            data=json.dumps({"name": "new", "category_id": 999999}),
            content_type="application/json"
        )
        assert res.status_code == 404

    def test_add_duplicate_tag(self, client):
        """
        Should not allow creating a tag with a duplicate name.
        """
        
        cat = Category.objects.create(name="General")
        Tag.objects.create(name="duplicate")
        payload = {"name": "duplicate", "category_id": cat.id}
        res = client.post(
            "/api/tags/add_tag",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 400
        resp = res.json()
        error_msg = resp.get("msg", "") or resp.get("message", "") or resp.get("detail", "")
        assert "already exists" in error_msg

    def test_remove_tag(self, client):
        """
        Should remove the tag from the database and category.
        """
        
        cat = Category.objects.create(name="General")
        tag = Tag.objects.create(name="toremove")
        cat.tags.add(tag)
        res = client.delete(f"/api/tags/remove_tag/{tag.id}/")
        assert res.status_code == 200
        assert not Tag.objects.filter(name="toremove").exists()
        assert tag not in cat.tags.all()

    def test_remove_tag_invalid_id(self, client):
        """
        Should return 404 when trying to delete a non-existent tag.
        """
        
        res = client.delete("/api/tags/remove_tag/999999/")
        assert res.status_code == 404

    def test_edit_tag(self, client):
        """
        Should allow editing a tag's name and category.
        """
        
        cat = Category.objects.create(name="General")
        tag = Tag.objects.create(name="oldname")
        cat.tags.add(tag)
        payload = {"name": "newname", "category_id": cat.id}
        res = client.put(
            f"/api/tags/edit_tag/{tag.id}/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert res.json()["name"] == "newname"
        assert Tag.objects.filter(name="newname").exists()
        assert not Tag.objects.filter(name="oldname").exists()

    def test_edit_tag_invalid_id(self, client):
        """
        Should return 404 for a non-existent tag ID.
        """
        
        payload = {"name": "doesntmatter", "category_id": 1}
        res = client.put(
            "/api/tags/edit_tag/999999/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 404

    def test_get_all_tags(self, client):
        """
        Should fetch all tags in the system.
        """
        
        Tag.objects.create(name="t1")
        Tag.objects.create(name="t2")
        res = client.get("/api/tags/get_all_tags")
        assert res.status_code == 200
        tag_names = [t["name"] for t in res.json()["tags"]]
        assert "t1" in tag_names and "t2" in tag_names

    def test_get_tag_by_name_and_id(self, client):
        """
        Should retrieve tag using both ID and name.
        """
        
        tag = Tag.objects.create(name="findme")
        res_by_id = client.get(f"/api/tags/get_tag/{tag.id}/")
        assert res_by_id.status_code == 200
        assert res_by_id.json()["name"] == "findme"
        res_by_name = client.get(f"/api/tags/get_tag_by_name/findme/")
        assert res_by_name.status_code == 200
        assert res_by_name.json()["name"] == "findme"

    def test_add_and_remove_tag_to_category(self, client):
        """
        Should associate and disassociate a tag with a category.
        """
        
        tag = Tag.objects.create(name="extratag")
        cat = Category.objects.create(name="MyCat")
        res_add = client.post(f"/api/tags/add_tag_to_category/{cat.id}/{tag.id}/")
        assert res_add.status_code == 200
        assert cat.tags.filter(id=tag.id).exists()
        res_remove = client.delete(f"/api/tags/remove_tag_from_category/{cat.id}/{tag.id}/")
        assert res_remove.status_code == 200
        assert not cat.tags.filter(id=tag.id).exists()

    def test_specialist_tags_crud(self, client):
        """
        Should add and remove a specialist tag.
        """
        
        cat = Category.objects.create(name="SpecCat")
        payload = {"name": "spec1", "category_id": cat.id}
        res = client.post(
            "/api/tags/add_specialist_tag",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 201
        st_id = res.json()["id"]
        assert SpecialistTag.objects.filter(id=st_id).exists()
        res_rm = client.delete(f"/api/tags/remove_specialist_tag/{st_id}/")
        assert res_rm.status_code == 200
        assert not SpecialistTag.objects.filter(id=st_id).exists()

    def test_category_get_and_association(self, client):
        """
        Should return categories and validate tag/specialist associations.
        """
        
        cat = Category.objects.create(name="testcat")
        tag = Tag.objects.create(name="taggy")
        spec_tag = SpecialistTag.objects.create(name="specgy")
        cat.tags.add(tag)
        cat.specialist_tags.add(spec_tag)
        res = client.get("/api/tags/get_categories")
        assert res.status_code == 200
        categories = res.json()["categories"]
        assert any(c["name"] == "testcat" for c in categories)
        res2 = client.get(f"/api/tags/get_category_by_tag_id/{tag.id}/")
        assert res2.status_code == 200
        cats = res2.json()["categories"]
        assert any(c["name"] == "testcat" for c in cats)
        res3 = client.get(f"/api/tags/get_category_by_specialist_tag_id/{spec_tag.id}/")
        assert res3.status_code == 200
        scats = res3.json()["categories"]
        assert any(c["name"] == "testcat" for c in scats)
