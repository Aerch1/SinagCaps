import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Download, FileText, Calendar } from "lucide-react"

export default function Reports() {
    const reports = [
        {
            id: 1,
            title: "User Activity Report",
            description: "Monthly user engagement and activity metrics",
            date: "2024-01-15",
            status: "Ready",
        },
        {
            id: 2,
            title: "Revenue Report",
            description: "Financial performance and revenue analysis",
            date: "2024-01-14",
            status: "Ready",
        },
        {
            id: 3,
            title: "System Performance",
            description: "Server performance and uptime statistics",
            date: "2024-01-13",
            status: "Processing",
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                    <p className="text-gray-600">Generate and download system reports</p>
                </div>
                <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate New Report
                </Button>
            </div>

            <div className="grid gap-4">
                {reports.map((report) => (
                    <Card key={report.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                    <CardDescription>{report.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === "Ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {report.status}
                                    </span>
                                    {report.status === "Ready" && (
                                        <Button size="sm" variant="outline">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="mr-2 h-4 w-4" />
                                Generated on {new Date(report.date).toLocaleDateString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
