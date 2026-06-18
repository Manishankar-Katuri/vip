import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

declare const __SUPABASE_URL__: string | undefined
declare const __SUPABASE_ANON_KEY__: string | undefined

const supabaseUrl = __SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = __SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number
    type: string
  }
}

interface ShaderProps {
  source: string
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number
      type: string
    }
  }
  maxFps?: number
}

interface SignInPageProps {
  className?: string
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number
  opacities?: number[]
  colors?: number[][]
  containerClassName?: string
  dotSize?: number
  showGradient?: boolean
  reverse?: boolean
}) => {
  return (
    <div className={cn('h-full relative w-full', containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={['x', 'y']}
        />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
  )
}

interface DotMatrixProps {
  colors?: number[][]
  opacities?: number[]
  totalSize?: number
  dotSize?: number
  shader?: string
  center?: ('x' | 'y')[]
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = '',
  center = ['x', 'y'],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]]
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: 'uniform3fv',
      },
      u_opacities: {
        value: opacities,
        type: 'uniform1fv',
      },
      u_total_size: {
        value: totalSize,
        type: 'uniform1f',
      },
      u_dot_size: {
        value: dotSize,
        type: 'uniform1f',
      },
      u_reverse: {
        value: shader.includes('u_reverse_active') ? 1 : 0,
        type: 'uniform1i',
      },
    }
  }, [colors, opacities, totalSize, dotSize, shader])

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${
              center.includes('x')
                ? 'st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));'
                : ''
            }
            ${
              center.includes('y')
                ? 'st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));'
                : ''
            }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);
            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  )
}

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string
  maxFps?: number
  uniforms: Uniforms
}) => {
  const { size } = useThree()
  const ref = useRef<THREE.Mesh>(null)
  const lastFrameTimeRef = useRef(0)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const timestamp = clock.getElapsedTime()
    const minFrameTime = 1 / maxFps

    if (timestamp - lastFrameTimeRef.current < minFrameTime) return
    lastFrameTimeRef.current = timestamp

    const material = ref.current.material as THREE.ShaderMaterial
    material.uniforms.u_time.value = timestamp
  })

  const preparedUniforms = useMemo(() => {
    const preparedUniforms: Record<string, { value: unknown; type?: string }> = {}

    for (const uniformName in uniforms) {
      const uniform = uniforms[uniformName]

      switch (uniform.type) {
        case 'uniform1f':
          preparedUniforms[uniformName] = { value: uniform.value, type: '1f' }
          break
        case 'uniform1i':
          preparedUniforms[uniformName] = { value: uniform.value, type: '1i' }
          break
        case 'uniform3f':
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value as number[]),
            type: '3f',
          }
          break
        case 'uniform1fv':
          preparedUniforms[uniformName] = { value: uniform.value, type: '1fv' }
          break
        case 'uniform3fv':
          preparedUniforms[uniformName] = {
            value: (uniform.value as number[][]).map((v: number[]) => new THREE.Vector3().fromArray(v)),
            type: '3fv',
          }
          break
        case 'uniform2f':
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value as number[]),
            type: '2f',
          }
          break
        default:
          break
      }
    }

    preparedUniforms.u_time = { value: 0, type: '1f' }
    preparedUniforms.u_resolution = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    }
    return preparedUniforms
  }, [uniforms, size.width, size.height])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: preparedUniforms,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    })
  }, [preparedUniforms, source])

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  )
}

export const SignInPage = ({ className }: SignInPageProps) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'email' | 'success'>('email')
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true)
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientAccessLabel, setClientAccessLabel] = useState('')

  const validateAccess = async (client: SupabaseClient) => {
    const { data: allowed, error: allowedError } = await client
      .from('allowed_users')
      .select('role, active')
      .maybeSingle()

    if (allowedError || !allowed || !allowed.active) {
      await client.auth.signOut()
      setMessage('This email is not authorized for VIP access.')
      setStep('email')
      setReverseCanvasVisible(false)
      setInitialCanvasVisible(true)
      return false
    }

    const { data: mappings, error: mappingError } = await client
      .from('client_users')
      .select('role, clients(client_name, client_slug)')
      .limit(1)

    if (mappingError || !mappings || mappings.length === 0) {
      setMessage('Your account is authorized but no client access has been assigned.')
      return false
    }

    const mapping = mappings[0] as {
      clients?: { client_name?: string | null; client_slug?: string | null } | null
    }
    setClientAccessLabel(mapping.clients?.client_name || mapping.clients?.client_slug || 'VIP')
    setMessage('')
    return true
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!supabase) {
      setMessage('VIP sign-in is not configured yet.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      setLoading(false)
      setMessage('Could not sign in. Check the email and password set for this Supabase Auth user.')
      return
    }

    const allowed = await validateAccess(supabase)
    setLoading(false)
    if (allowed) {
      setInitialCanvasVisible(false)
      setReverseCanvasVisible(false)
      setStep('success')
    }
  }

  useEffect(() => {
    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        setLoading(true)
        const allowed = await validateAccess(supabase)
        setLoading(false)
        if (allowed) {
          setInitialCanvasVisible(false)
          setReverseCanvasVisible(false)
          setStep('success')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className={cn('flex w-[100%] flex-col min-h-screen bg-black relative', className)}>
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}

        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-[420px] px-6 text-center">
              <AnimatePresence mode="wait">
                {step === 'email' ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-2 text-center">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome to VIP</h1>
                      <p className="text-[1.8rem] text-white/70 font-light">Vertical Intelligence Platform</p>
                      <p className="pt-3 text-sm text-white/45">Access is restricted to invited Antaryami AI users.</p>
                    </div>

                    <div className="space-y-4 text-center">
                      <form onSubmit={handlePasswordSubmit} className="mx-auto w-full space-y-3">
                        <div className="space-y-2 text-center">
                          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-white/40" htmlFor="vip-email">
                            Email
                          </label>
                          <input
                            id="vip-email"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="block w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-white placeholder:text-white/35 backdrop-blur-[1px] focus:border-white/30 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-2 text-center">
                          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-white/40" htmlFor="vip-password">
                            Password
                          </label>
                          <input
                            id="vip-password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className="block w-full rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-center text-white placeholder:text-white/35 backdrop-blur-[1px] focus:border-white/30 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="pt-1">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loading ? 'Signing in...' : 'Sign in to VIP'}
                          </button>
                        </div>
                      </form>
                      {message && <p className="text-sm text-white/60">{message}</p>}
                    </div>

                  </motion.div>
                ) : (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">You're in!</h1>
                      <p className="text-[1.25rem] text-white/50 font-light">
                        {clientAccessLabel ? `${clientAccessLabel} access ready` : 'Welcome'}
                      </p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="py-10"
                    >
                      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      onClick={() => navigate('/dashboard')}
                      className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
                    >
                      Continue to VIP
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
