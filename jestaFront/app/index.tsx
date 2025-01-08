import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'
import RegisterScreen from './(authentication)/register'

const index = () => {
  return (
    <RegisterScreen />
  )
}


// api/auth.js
export async function checkIfLoggedIn() {
  return false
}

export default index