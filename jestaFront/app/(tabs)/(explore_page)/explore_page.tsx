import { View, Text } from 'react-native'
import React, { useContext} from 'react'
import { UserContext } from "../../authContext";

const Explore_Page = () => {
  const {user,setUser} = useContext(UserContext);
  console.log('user', user)
  return (
    <div>
      <h1>{user.id}</h1>
    </div>
  )
}

export default Explore_Page