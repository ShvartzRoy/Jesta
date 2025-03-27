#from typing import List
from pydantic import BaseModel, EmailStr
from ninja import Schema, ModelSchema

from .models import *

class LogInSchema(BaseModel):
    email: str
    password: str

class RegisterSchema(BaseModel):
    email: str
    password: str
    
class SavedServiceSchema(BaseModel):
    id: int
    state: str
    title: str

class PushTokenSchema(Schema):
    token: str
    device_id: str

class UserSchema(ModelSchema):
    saved_services: list[SavedServiceSchema]
    expo_push_tokens: list[dict]
    
    class Meta:
        model = CustomUser
        fields = ["id", "email", "saved_services", "expo_push_tokens"]

        

class Error(Schema):
    error:str

class Msg(Schema):
    msg:str

# class EmailSchema(BaseModel):
#     email: EmailStr
    

class ProfileSchema(ModelSchema):
    class Meta:
        model = Profile
        fields = ["name", "bio", "age", "facebook", "linkedin", "instagram"]

class GetProfileSchema(ModelSchema):
    class Meta:
        model = Profile
        fields = ["name", "bio", "age","image","resume", "facebook", "linkedin", "instagram"]