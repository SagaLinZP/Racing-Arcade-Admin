export interface MozaDevice {
  id: string
  name: string
  category: string
  icon: string
}

export const mozaDevices: MozaDevice[] = [
  { id: 'r9', name: 'R9 Wheel Base', category: 'Wheel Base', icon: '🖱️' },
  { id: 'r16', name: 'R16 Wheel Base', category: 'Wheel Base', icon: '🖱️' },
  { id: 'r21', name: 'R21 Wheel Base', category: 'Wheel Base', icon: '🖱️' },
  { id: 'crp', name: 'CRP Pedals', category: 'Pedals', icon: '🦶' },
  { id: 'csr', name: 'CSR Pedals', category: 'Pedals', icon: '🦶' },
  { id: 'hbp', name: 'HPB Handbrake', category: 'Handbrake', icon: '🛑' },
  { id: 'seq', name: 'Sequential Paddle', category: 'Shifter', icon: '🔄' },
  { id: 'hpattern', name: 'H-Pattern Shifter', category: 'Shifter', icon: '🔄' },
]
