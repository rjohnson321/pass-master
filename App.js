
import { StyleSheet, Text, View, TextInput, Pressable, Image, FlatList, Button, SafeAreaView, Alert, Linking } from 'react-native';
import { useEffect, useState } from 'react'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from "expo-sqlite";
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

const Stack = createNativeStackNavigator();

const buttonImg = require('./assets/button.jpg')

const db = SQLite.openDatabase("PassMaster.db");

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Users (username VARCHAR(50) PRIMARY KEY NOT NULL, password VARCHAR(50)); ",
        [],
        () => console.log("Created users"),
        (tx, err) => console.log(err)
      );

      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS Entries (service VARCHAR(50), username VARCHAR(50), password VARCHAR(50), owner VARCHAR(50), PRIMARY KEY (service, owner)); ",
        [],
        () => console.log("Created Entries"),
        (tx, err) => console.log(err)
      );

      tx.executeSql(
        "SELECT * FROM sqlite_master;",
        [], 
        (_, result) => console.log(result.rows)
      )
    });
  }, [])

  login = () => {
    // login validation here
    if (username == "" || password == "") {
      Alert.alert("Invalid Login", "Please enter both a username and a password.");
    } else {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM Users WHERE username=?",
          [username],
          (tx, result) => {
            if (result.rows.length == 0) { // user is registering, add a new entry to users
              tx.executeSql(
                "INSERT INTO Users (username, password) VALUES (?, ?)",
                [username, password],
                () => console.log("Insert successfull"),
                (tx, err) => console.log(err)
              );
              
              navigation.navigate("Main", {username, password});
            } else if (result.rows.item(0).password == password) // passwords match, user logged in successfully
              navigation.navigate("Main", {username, password});
            else //incorrect password
              Alert.alert("Incorrect Password", "Incorrect password, please try again.");
          }
        ) 
      })
    }

    
    
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login or Register</Text>
      
      <TextInput style={styles.textInput} placeholder='Enter Username' onChangeText={(text) => setUsername(text)}></TextInput>
      <TextInput style={styles.textInput} placeholder='Enter Password' onChangeText={(text) => setPassword(text)}></TextInput>
      <Pressable onPress={login}><Image source={buttonImg} ></Image></Pressable>
    </View>
  );
}

const MainScreen = ({route, navigation}) => {
  const [entries, setEntries] = useState([]);
  const [activeUser, setActiveUser] = useState("");
  const [newEntry, setNewEntry] = useState(null);

  const openForm = (entry) => {
    navigation.navigate("Form", {entry});
  }

  const refreshEntries = () => { 
    setEntries([]);
    console.log("Refreshing entries");
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM Entries WHERE owner=? ORDER BY service",
        [activeUser],
        (tx, result) => {
          console.log(result.rows._array.length + " Entries found");
          const arr = [];
          for (const entry of result.rows._array) {
            setEntries(current => [...current, {
              service: entry.service,
              username: entry.username,
              password: entry.password
            }]); 
          }
          console.log(entries);
        }
      )
    })
  }
  
  const deleteEntry = (entry) => { //needs testing
    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM Entries WHERE owner=? AND service=?",
        [activeUser, entry.service],
        (tx, result) => console.log(result.rowsAffected + " deleteed rows"),
        (tx, err) => console.log(err)
      )
    })
    refreshEntries();
  }

  const Item = ({entry}) => {
    console.log("Entry: " + entry); 
    
    return (
      <View style={styles.entry}>
        <Text style={styles.service} onPress={() => Linking.openURL(`http://${entry.service}`)}>{entry.service}</Text>
        <Text>Username: {entry.username}</Text>
        <Text>Password: {entry.password}</Text>
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={() => openForm(entry)}><Text style={styles.buttonText}>Edit</Text></Pressable>
          <Pressable style={styles.button} onPress={() => deleteEntry(entry)}><Text style={styles.buttonText}>Delete</Text></Pressable>
        </View>
      </View>
    )
  }; 
  
  const entry = route.params.entry;
  if (entry && entry != newEntry) { // prevent an infinite "re-render"
    setNewEntry(entry);
    
    db.transaction((tx) => {
      if (route.params.isModifying) { // entry is being changed, not technically new
        tx.executeSql(
          "UPDATE Entries SET username=?, password=? " +
          "WHERE service=? AND owner=?",
          [entry.username, entry.password, entry.service, activeUser],
          () => console.log("Update successfull"),
          (_, err) => console.log(err)
        );
      } else {
        tx.executeSql(
          "INSERT INTO Entries (service, username, password, owner) VALUES (?, ?, ?, ?)",
          [entry.service, entry.username, entry.password, activeUser],
          () => console.log("Entry insert successful"),
          (_, err) => console.log(err)
        )
      }
      refreshEntries();
    });
  }
 
  useEffect(() => {
    if (route.params.username) { // this runs everytime a user reaches the screen from the login
      setActiveUser(route.params.username);
      refreshEntries();
      console.log("Logged in successfully");
    }
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      { entries.length == 0 
      ? <Text>No entries yet</Text> 
      : <Text></Text>
      }
      <FlatList style={styles.list}
          data = {entries}
          renderItem = {({item: entry}) => <Item entry={entry}/>}
        />
      <Text style={styles.info}>Logged in as: {activeUser}</Text>
      <Button style={styles.addButton} title={'Add Entry'} onPress={() => openForm(null)}><Text>Add Entry</Text></Button>
    </SafeAreaView>
  );
}

const FormScreen = ({route, navigation}) => {
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isModifying, setIsModifying] = useState(false);

  const entry = route.params.entry;
  if (entry != null && service != entry.service) {
    setService(entry.service);
    setUsername(entry.username);
    setPassword(entry.password);
    setIsModifying(true);
  }

  confirmEntry = () => {

    if (service == "" || username == "" || password == "") {
      Alert.alert("Please fill out all fields");
      return;
    }

    navigation.navigate("Main", {
      entry: {service, username, password},
      isModifying
    });
  }

  return (
    <View style={styles.container}>
      {isModifying 
       ? <TextInput style={styles.textInput} value={service} editable={false}/> 
       : <TextInput style={styles.textInput} placeholder='Enter the service' value={service} onChangeText={(text) => setService(text)}/>
      }
      
      <TextInput style={styles.textInput} placeholder='Enter the username' value={username} onChangeText={(text) => setUsername(text)}/>
      <TextInput style={styles.textInput} placeholder='Enter the password' value={password} onChangeText={(text) => setPassword(text)}/>

      <Button title={"Confirm"} onPress={() => confirmEntry()}><Text>Confirm</Text></Button>
    </View>
  );
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
    backgroundColor: '#ADD8E6',
    padding: 20,
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center'
  },
  button: {
    backgroundColor: '#2e5984',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 5,
    textColor: '#ffffff',
  },
  buttonText: {
    color: '#ffffff'
  },
  service: {
    color: '#2e5984',
    textDecorationLine: 'underline',
    alignSelf: 'center',
    marginBottom: 5
  },
  title: {
    fontSize: 25,
    marginBottom: 50
  },
  textInput: {
    marginBottom: 20,
    borderWidth: 2,
    padding: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 10,
    borderColor: '#ADD8E6'
  },
  info: {
    marginBottom: 10
  }
});
