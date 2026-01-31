export default function HabitanimalDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Habitanimal Details</h1>
      <p className="text-gray-600">Habitanimal ID: {params.id}</p>
      <p className="text-gray-600 mt-2">Habitanimal detail page placeholder</p>
    </div>
  )
}
