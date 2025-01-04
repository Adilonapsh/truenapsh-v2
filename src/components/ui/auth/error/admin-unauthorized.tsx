import { MapPin, Compass, ArrowLeft } from 'lucide-react'
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminUnauthorized() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-white">
            <Card className="w-[380px] max-w-[90vw] border-4 border-black shadow-lg">
                <CardHeader className="bg-black text-white">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-6 w-6" />
                        <CardTitle className="text-2xl font-bold">Whoa there, explorer!</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <p className="text-gray-800 mb-4">
                        Looks like you've wandered into uncharted territory - our top-secret
                        cartographer's vault. 🗺️ Unless you've got the legendary map-folding skills
                        of an admin, this area is as off-limits as the edge of a flat Earth!
                    </p>
                    <p className="text-gray-800">
                        Don't worry, even the best explorers sometimes find themselves in a cartographic conundrum.
                        If you think you should have the keys to this monochromatic kingdom, give our
                        map maestros a shout!
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button asChild variant="outline" className="w-full border-2 border-black text-black hover:bg-gray-200">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Navigate back to known lands
                        </Link>
                    </Button>
                    <div className="flex items-center justify-center text-sm text-gray-600">
                        <Compass className="mr-2 h-4 w-4 animate-spin" />
                        <p>Redrawing route to public territories...</p>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

