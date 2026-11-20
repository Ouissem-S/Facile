import { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function App() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  async function pickPhoto() {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
    });

    if (picked.canceled) return;

    setPhotoUri(picked.assets[0].uri);
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={pickPhoto}>
        <Text style={styles.buttonText}>Choose photo</Text>
      </Pressable>

      {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 16, gap: 16 },
  button: { backgroundColor: "#1f2937", padding: 14, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  photo: { width: "100%", height: 400, resizeMode: "contain" },
});