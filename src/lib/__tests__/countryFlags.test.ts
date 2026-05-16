import { describe, it, expect } from 'vitest'
import { countryFlag } from '../countryFlags'

describe('countryFlag', () => {
  it('returns French flag for France', () => {
    const flag = countryFlag('France')
    expect(flag).toBe('\uD83C\uDDEB\uD83C\uDDF7')
  })

  it('returns US flag for United States', () => {
    const flag = countryFlag('United States')
    expect(flag).toBe('\uD83C\uDDFA\uD83C\uDDF8')
  })

  it('returns UK flag for United Kingdom', () => {
    const flag = countryFlag('United Kingdom')
    expect(flag).toBe('\uD83C\uDDEC\uD83C\uDDE7')
  })

  it('returns globe for unknown country', () => {
    const flag = countryFlag('Atlantis')
    expect(flag).toBe('\uD83C\uDF10')
  })

  it('returns EU flag for European Union', () => {
    const flag = countryFlag('European Union')
    expect(flag).toBe('\uD83C\uDFEA')
  })

  it('returns flag for China', () => {
    const flag = countryFlag('China')
    expect(flag).toBe('\uD83C\uDDE8\uD83C\uDDF3')
  })

  it('returns flag for Russia', () => {
    const flag = countryFlag('Russia')
    expect(flag).toBe('\uD83C\uDDF7\uD83C\uDDFA')
  })

  it('handles empty string', () => {
    const flag = countryFlag('')
    expect(flag).toBe('\uD83C\uDF10')
  })

  it('handles special characters in name', () => {
    const flag = countryFlag("Côte d'Ivoire")
    expect(flag).toBe('\uD83C\uDDE8\uD83C\uDDEE')
  })
})
