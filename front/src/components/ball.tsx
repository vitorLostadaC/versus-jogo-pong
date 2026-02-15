import { Circle, Group } from 'react-konva'

export interface BallProps {
  x: number
  y: number
  radius: number
  color: string
}

export const Ball = ({ color, radius, x, y }: BallProps) => {
  return (
    <Group>
      <Circle
        x={x}
        y={y}
        radius={radius + 3}
        fill={color}
        opacity={0.25}
        listening={false}
      />
      <Circle
        x={x}
        y={y}
        radius={radius}
        fill={color}
        shadowColor={color}
        shadowBlur={8}
        shadowOpacity={0.6}
        listening={false}
      />
    </Group>
  )
}
