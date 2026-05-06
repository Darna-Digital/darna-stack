import { Suspense } from "react"
import { TodoList } from "./todo-list"

export const metadata = {
  title: "Todos",
}

export default function TodosPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Todos</h1>
      <p className="mt-1 text-sm text-zinc-500">
        End-to-end typed via open api + Effect.
      </p>
      <Suspense
        fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      >
        <TodoList />
      </Suspense>
    </main>
  )
}
