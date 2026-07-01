# Ownership Tracing

When a user wants to understand who really owns a property or company, trace the full ownership chain:

1. **Start with the property** — Get property details including ownership. Note the CVR numbers of corporate owners.
2. **Follow the chain** — For each corporate owner, pull CVR details, check the network graph endpoint for parent/child relationships.
3. **Expand the network** — Use the `expand_network` endpoint to trace ownership multiple levels deep. Look for circular ownership patterns.
4. **Check persons** — For legal owners who are persons (not companies), use EJF endpoints to map their full property portfolio.
5. **Related entities** — Use `partners_in_crime` to find co-owned properties and shared directorships.
6. **Map the structure** — Present as a tree diagram showing the ownership chain from the property up to ultimate beneficial owners.

## Output format

```
## Ownership Structure: [property/company name]

### Direct Owner
- [Name], [CVR/Person ID]
- Ownership share: X/Y
- Role: Legal Owner

### Ownership Chain
[tree diagram or nested list showing parent relationships]

### Ultimate Beneficial Owners
| Entity | Type | Level | Share |
|--------|------|-------|-------|
| ... | ... | ... | ... |

### Related Entities (Partners in Crime)
- [Name], [CVR] — co-owns X properties, shares Y directors

### Portfolio Map
Total holdings by this ownership group:
- Properties: X (total m²: X)
- Companies: X
- Geographic concentration: [municipalities]
```
