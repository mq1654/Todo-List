import TodoBoard from '../components/TodoBoard'

function TodoPage() {
    return (
        <div className="h-[calc(100vh-56px)] flex flex-col py-4 px-2 sm:px-4 overflow-hidden">
            <TodoBoard />
        </div>
    )
}

export default TodoPage
