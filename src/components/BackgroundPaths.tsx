import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

type BackgroundPathsProps = {
  title?: string
  buttonText?: string
  buttonTo?: string
}

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${
      312 - i * 5 * position
    } ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${
      470 - i * 6
    } ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="background-paths__layer" aria-hidden="true">
      <svg className="background-paths__svg" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + path.id * 0.27,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function BackgroundPaths({
  title = 'Background Paths',
  buttonText = 'Discover Excellence',
  buttonTo = '/tools',
}: BackgroundPathsProps) {
  const words = title.split(' ')

  return (
    <main className="background-paths">
      <div className="background-paths__backdrop">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="background-paths__content">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="background-paths__inner"
        >
          <h1 className="background-paths__title" aria-label={title}>
            {words.map((word, wordIndex) => (
              <span key={word} className="background-paths__word" aria-hidden="true">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: 'spring',
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="background-paths__letter"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div className="premium-button-wrap">
            <Link className="premium-button" to={buttonTo}>
              <span className="premium-button__label">{buttonText}</span>
              <span className="premium-button__arrow">-&gt;</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
