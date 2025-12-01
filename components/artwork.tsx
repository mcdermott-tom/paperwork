import { Disc } from 'lucide-react'

// eslint-disable-next-line @next/next/no-img-element
export function ReleaseArtwork({ url, size = "md" }: { url?: string | null, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  }

  if (url) {
    return (
      <img 
        src={url} 
        alt="Artwork" 
        className={`${sizeClasses[size]} rounded-md object-cover border border-gray-200 bg-gray-100`} 
      />
    )
  }

  return (
    <div className={`${sizeClasses[size]} rounded-md bg-gray-100 flex items-center justify-center border border-gray-200`}>
      <Disc className="text-gray-400 h-1/2 w-1/2" />
    </div>
  )
}