import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"

export default function Landing() {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Welcome to Your App</h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            A modern web application with role-based authentication and a beautiful admin interface.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link to="/login">
                                <Button size="lg">Get started</Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg">
                                    Learn more
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600">Features</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            Everything you need to get started
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Secure Authentication</CardTitle>
                                    <CardDescription>JWT-based authentication with role-based access control</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Admin Dashboard</CardTitle>
                                    <CardDescription>Modern and responsive admin interface with sidebar navigation</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>MySQL Database</CardTitle>
                                    <CardDescription>Reliable data storage with proper database relationships</CardDescription>
                                </CardHeader>
                            </Card>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}
