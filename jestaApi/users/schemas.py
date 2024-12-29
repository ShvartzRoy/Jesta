from pydantic import BaseModel
from ninja import Schema, ModelSchema

from .models import *

class LogInSchema(BaseModel):
    email: str
    password: str

class RegisterSchema(BaseModel):
    email: str
    password: str

class UserSchema(ModelSchema):
    class Meta:
        model = CustomUser
        fields = ["email"]

class Error(Schema):
    error:str

class Msg(Schema):
    msg:str


class ProfileSchema(ModelSchema):
    class Meta:
        model = Profile
        fields = ["name", "bio", "age", "image"]