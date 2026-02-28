import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight mb-2">404</h1>
        <h2 className="font-heading text-lg font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          The page you are looking for does not exist or has been moved. Check the URL or navigate back.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="outline" className="font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button className="font-semibold shadow-sm shadow-primary/25">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
