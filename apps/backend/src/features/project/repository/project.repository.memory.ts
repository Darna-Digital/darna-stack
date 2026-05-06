import { Effect, Ref } from "effect"
import type { ProjectRepo } from "./project.repository.js"
import type { Project, ProjectId } from "../schema/project.model.js"

export const createMemoryProjectRepo = (
  seed: readonly Project[] = [],
): Effect.Effect<ProjectRepo> =>
  Effect.gen(function* () {
    const ref = yield* Ref.make<Map<ProjectId, Project>>(
      new Map(seed.map((p) => [p.id, p])),
    )

    const list: ProjectRepo["list"] = () =>
      Ref.get(ref).pipe(Effect.map((m) => Array.from(m.values())))

    const findById: ProjectRepo["findById"] = (id) =>
      Ref.get(ref).pipe(Effect.map((m) => m.get(id)))

    const create: ProjectRepo["create"] = (input) =>
      Effect.sync(() => crypto.randomUUID()).pipe(
        Effect.flatMap((rawId) => {
          const project: Project = {
            id: rawId as Project["id"],
            name: input.name,
            createdAt: new Date().toISOString(),
          }
          return Ref.update(ref, (m) =>
            new Map(m).set(project.id, project),
          ).pipe(Effect.as(project))
        }),
      )

    const update: ProjectRepo["update"] = (id, patch) =>
      Ref.modify(ref, (m) => {
        const existing = m.get(id)
        if (!existing) return [undefined, m] as const
        const next: Project = {
          ...existing,
          ...(patch.name !== undefined ? { name: patch.name } : {}),
        }
        const nextMap = new Map(m).set(id, next)
        return [next, nextMap] as const
      })

    const remove: ProjectRepo["remove"] = (id) =>
      Ref.modify(ref, (m) => {
        if (!m.has(id)) return [false, m] as const
        const nextMap = new Map(m)
        nextMap.delete(id)
        return [true, nextMap] as const
      })

    return { list, findById, create, update, remove }
  })
