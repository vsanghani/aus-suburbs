"""Split a SQL script into statements psycopg can run one at a time.

Postgres function bodies are dollar-quoted and contain semicolons. A naive
split would cut them in half. Comments and ordinary string literals are kept
with the statement they belong to.
"""


def split_sql(script: str) -> list[str]:
    statements: list[str] = []
    buf: list[str] = []
    i = 0
    length = len(script)
    dollar_tag: str | None = None
    while i < length:
        if dollar_tag is not None:
            if script.startswith(dollar_tag, i):
                buf.append(dollar_tag)
                i += len(dollar_tag)
                dollar_tag = None
                continue
            buf.append(script[i])
            i += 1
            continue
        if script.startswith("--", i):
            end = script.find("\n", i)
            if end == -1:
                buf.append(script[i:])
                break
            buf.append(script[i : end + 1])
            i = end + 1
            continue
        char = script[i]
        if char == "'":
            buf.append(char)
            i += 1
            while i < length:
                buf.append(script[i])
                if script[i] == "'":
                    if i + 1 < length and script[i + 1] == "'":
                        buf.append("'")
                        i += 2
                        continue
                    i += 1
                    break
                i += 1
            continue
        if char == "$":
            tag = _dollar_tag(script, i)
            if tag is not None:
                dollar_tag = tag
                buf.append(tag)
                i += len(tag)
                continue
        if char == ";":
            _push(statements, "".join(buf))
            buf = []
            i += 1
            continue
        buf.append(char)
        i += 1
    _push(statements, "".join(buf))
    return statements


def _push(statements: list[str], raw: str) -> None:
    if _has_sql(raw):
        statements.append(raw.strip())


def _has_sql(statement: str) -> bool:
    for line in statement.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("--"):
            return True
    return False


def _dollar_tag(script: str, start: int) -> str | None:
    if script[start] != "$":
        return None
    end = start + 1
    while end < len(script) and (script[end].isalnum() or script[end] == "_"):
        end += 1
    if end < len(script) and script[end] == "$":
        return script[start : end + 1]
    return None
