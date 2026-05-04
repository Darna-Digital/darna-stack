import { Layer } from "effect"
import { TodosLive } from "../../features/todo/todo.layer.js"
import { TracingLayer } from "./tracing.js"

export const ServicesLayer = Layer.mergeAll(TracingLayer, TodosLive)
