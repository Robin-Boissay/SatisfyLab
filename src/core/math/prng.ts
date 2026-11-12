/**
 * Générateur Pseudo-Aléatoire Déterministe (Mulberry32)
 * Garantit une reproduction 100% identique des tirages sur toute machine avec la même graine (seed).
 */
export class PRNG {
  private state: number;

  constructor(seed: number = Date.now()) {
    this.state = seed >>> 0;
  }

  /**
   * Réinitialise le générateur avec une nouvelle graine
   */
  public reseed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Retourne la graine / état actuel
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Retourne un nombre flottant dans l'intervalle [0, 1)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retourne un nombre flottant entre min et max
   */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Retourne un entier entre min et max inclus
   */
  public rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Retourne une variation centrée autour de 0 dans [-amount/2, +amount/2]
   */
  public jitter(amount: number): number {
    return (this.next() - 0.5) * amount;
  }

  /**
   * Tire un élément aléatoire dans une liste
   */
  public choice<T>(items: T[]): T {
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }
}
