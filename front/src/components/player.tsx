import { Group, Rect } from 'react-konva'

export interface PlayerProps {
  x: number
  y: number
  width: number
  height: number
  color: string
}

export const Player = ({ x, y, width, color, height }: PlayerProps) => {
  const cornerRadius = height / 4
  return (
    <Group>
      {/* Outer glow */}
      <Rect
        x={x - 2}
        y={y - 2}
        width={width + 4}
        height={height + 4}
        fill="transparent"
        stroke={color}
        strokeWidth={4}
        cornerRadius={cornerRadius + 2}
        opacity={0.4}
        listening={false}
      />
      {/* Main paddle */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        cornerRadius={cornerRadius}
        shadowColor={color}
        shadowBlur={12}
        shadowOpacity={0.8}
        listening={false}
      />
      {/* Inner highlight */}
      <Rect
        x={x + 4}
        y={y + height * 0.15}
        width={width - 8}
        height={height * 0.25}
        fill="rgba(255,255,255,0.35)"
        cornerRadius={4}
        listening={false}
      />
    </Group>
  )
}
