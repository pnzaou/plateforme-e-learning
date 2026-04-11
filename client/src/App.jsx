import AppInitializer from "@/components/app-initializer"
import AppRouter from "@/routes/Router"

function App() {
  return (
    <AppInitializer>
      <AppRouter/>
    </AppInitializer>
  )
}

export default App