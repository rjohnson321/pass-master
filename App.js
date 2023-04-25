
import { StyleSheet, Text, View, TextInput, Pressable, Image, FlatList, Button, SafeAreaView } from 'react-native';
import { useEffect, useState } from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

const Stack = createNativeStackNavigator();

const buttonImg = require('./assets/button.jpg')

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  login = () => {
    // login validation here
    navigation.navigate("Main", {username, password})
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login or Register</Text>
      
      <TextInput placeholder='Enter Username' onChangeText={(text) => setUsername(text)}></TextInput>
      <TextInput placeholder='Enter Password' onChangeText={(text) => setPassword(text)}></TextInput>
      <Pressable onPress={login}><Image source={buttonImg} ></Image></Pressable>
    </View>
  );
}

const MainScreen = ({route, navigation}) => {
  const [entries, setEntries] = useState([]);

  console.log(route.params); // route.params should contain a username and password property, used to grab existing entries
  
  if (route.params.entry != undefined) { // got here from the "form" page
     // add or update entries here based on "isModifying" parameter
  } else { // got here from the "login" screen
    // populate entries here with username and password parameters
  }

  const openForm = (entry) => {
    navigation.navigate("Form", {entry});
  }
  
  const deleteEntry = (entry) => { //Implement later
  }

  const Item = ({entry}) => (
    <View style={styles.entry}>
      <Text>Service: {entry.service /* make this a clickable link*/}</Text>
      <Text>Username: {entry.username}</Text>
      <Text>Password: {entry.password}</Text>
      <Pressable onPress={() => openForm(entry)}><Text>Edit</Text></Pressable>
      <Pressable onPress={() => deleteEntry(entry)}><Text>Delete</Text></Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList style={styles.list}
        data = {entries}
        renderItem = {({entry}) => <Item entry={entry}/>}
      />
      <Button title={'Add Entry'} onPress={() => openForm(null)}><Text>Add Entry</Text></Button>
    </SafeAreaView>
  );
}

const FormScreen = ({route, navigation}) => {
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isModifying, setIsModifying] = useState(false);

  const entry = route.params.entry;
  if (entry != null) {
    setService(entry.service);
    setUsername(entry.username);
    setPassword(entry.password);
    setIsModifying(true);
  }

  confirmEntry = () => {
    navigation.navigate("Main", {
      entry: {service, username, password},
      isModifying
    });
  }

  return (<View style={styles.container}>
    <TextInput placeholder='Enter the service' value={service} onChangeText={(text) => setService(text)}/>
    <TextInput placeholder='Enter the username' value={username} onChangeText={(text) => setUsername(text)}/>
    <TextInput placeholder='Enter the password' value={password} onChangeText={(text) => setPassword(text)}/>

    <Pressable onPress={confirmEntry}><Text>Confirm</Text></Pressable>
  </View>);
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: "PassMaster",
            headerStyle: {
              backgroundColor: '#228B22',
            },
            headerTintColor: '#ffffff',
            headerTitleAlign: 'center'
          }} />
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{
            title: "Entries",
            headerStyle: {
              backgroundColor: '#228B22',
            },
            headerTintColor: '#ffffff',
            headerTitleAlign: 'center'
          }} />
        <Stack.Screen
          name="Form"
          component={FormScreen}
          options={{
            title: "Create or Edit",
            headerStyle: {
              backgroundColor: '#228B22',
            },
            headerTintColor: '#ffffff',
            headerTitleAlign: 'center'
          }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 3
  },
  entry: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
