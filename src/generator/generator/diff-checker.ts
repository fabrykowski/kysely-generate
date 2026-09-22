import { diffLines } from 'diff';

export class DiffChecker {
  #sanitize(string: string) {
    // Add `\n` to the end to avoid the "No newline at end of file" warning:
    return `${string.trim()}\n`;
  }

  diff(oldTypes: string, newTypes: string) {
    const changes = diffLines(
      this.#sanitize(oldTypes),
      this.#sanitize(newTypes),
    );

    if (!changes.some((change) => change.added || change.removed)) {
      return undefined;
    }

    return changes
      .map(({ added, removed, value }) => {
        const prefix = added ? '+' : removed ? '-' : ' ';
        return prefix + value.replace(/\n(?!$)/g, `\n${prefix}`);
      })
      .join('');
  }
}
