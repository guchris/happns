// Shadcn Imports
import { Card, CardTitle } from "@/components/ui/card"
import { Music, PartyPopper, Theater, Globe, Dumbbell, Users, Gamepad, Film } from "lucide-react"

export default function CategoriesGrid() {
    return (
        <div className="flex-1 max-w-[880px] md:max-w-[700px] lg:max-w-[880px] mx-auto p-4 space-y-4">
            <h3 className="text-xl font-semibold">explore top categories</h3>
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { name: "music", icon: <Music /> },
                    { name: "nightlife", icon: <PartyPopper /> },
                    { name: "arts", icon: <Theater /> },
                    { name: "culture", icon: <Globe /> },
                    { name: "fitness", icon: <Dumbbell /> },
                    { name: "family", icon: <Users /> },
                    { name: "gaming", icon: <Gamepad /> },
                    { name: "film", icon: <Film /> }
                ].map((category) => (
                    <div key={category.name} className="pointer-events-none opacity-50">
                        <Card key={category.name} className="flex flex-col items-center justify-center p-4 h-24 space-y-1">
                            <div className="flex items-center justify-center w-10 h-10 text-muted-foreground">{category.icon}</div>
                            <CardTitle className="line-clamp-1 text-center text-base font-medium">{category.name}</CardTitle>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}