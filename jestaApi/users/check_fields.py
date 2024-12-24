import re
def password_check(passwd):
    SpecialSym =['$', '@', '#', '%']
    if len(passwd) < 6:
        print('length should be at least 6')
        return False
         
    if len(passwd) > 20:
        print('length should be not be greater than 8')
        return False
        
    # when we are serious about password security

    # if not any(char.isdigit() for char in passwd):
    #     print('Password should have at least one numeral')
    #     return False
         
    # if not any(char.isupper() for char in passwd):
    #     print('Password should have at least one uppercase letter')
    #     return False
         
    # if not any(char.islower() for char in passwd):
    #     print('Password should have at least one lowercase letter')
    #     return False
         
    # if not any(char in SpecialSym for char in passwd):
    #     print('Password should have at least one of the symbols $@#')
    #     return False
    return True
    
def check_email(email: str) -> bool:
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return False
        return True