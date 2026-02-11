export function useConfetti() {
  const celebrate = () => {
    const count = 100
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.pointerEvents = 'none'
    container.style.zIndex = '9999'
    document.body.appendChild(container)

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    const shapes = ['●', '■', '▲', '★']

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div')
      const color = colors[Math.floor(Math.random() * colors.length)]
      const shape = shapes[Math.floor(Math.random() * shapes.length)]
      const left = Math.random() * 100
      const animationDuration = 2 + Math.random() * 3
      const size = 10 + Math.random() * 10

      confetti.textContent = shape
      confetti.style.position = 'absolute'
      confetti.style.left = `${left}%`
      confetti.style.top = '-20px'
      confetti.style.color = color
      confetti.style.fontSize = `${size}px`
      confetti.style.animation = `confetti-fall ${animationDuration}s linear forwards`
      confetti.style.opacity = '1'

      container.appendChild(confetti)
    }

    if (!document.getElementById('confetti-styles')) {
      const style = document.createElement('style')
      style.id = 'confetti-styles'
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    setTimeout(() => {
      document.body.removeChild(container)
    }, 5000)
  }

  return {
    celebrate
  }
}
