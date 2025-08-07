const FloatingShape = ({ color, size, top, left, delay }) => {
    return (
        <div
            className={`absolute rounded-full ${color} ${size} opacity-20 animate-float `}
            style={{
                top,
                left,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

export default FloatingShape
