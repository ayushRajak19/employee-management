# Sales Intelligence workflow

## Why each section exists

| Section | Business purpose | Primary owner |
| --- | --- | --- |
| Country intelligence | Groups sales records by the country/market selected on leads and customers. | Sales records the market; managers and HR review coverage. |
| Territories | Defines business ownership groups for sales teams. | Sales leadership manages territories and employee assignments. |
| Sales employees | Shows workforce capacity and performance inside the viewer's resolved scope. | HR and Sales leadership read; employee sees only self analytics. |
| Leads | Stores potential buyers before they become customers. | Sales employee or manager. |
| Customers | Stores confirmed buyers, either converted from a lead or added directly. | Sales employee or manager. |
| Pipeline | Stores active commercial opportunities for customers. | Sales employee or manager. |
| Targets | Stores approved employee or territory goals for a fixed period. | Sales manager or department head; HR and employees read. |
| Revenue | Stores realized value, normally generated from a won opportunity. | System automation; exceptional manual entry is restricted. |
| Channel partners | Stores distributors, dealers, resellers and service partners. | Sales employee or manager. |

## Normal operating flow

1. Select the country/market while adding a lead or customer.
2. Sales leadership creates a territory and assigns its team members.
3. Add a lead in that territory.
4. Move the lead through `NEW`, `CONTACTED`, `QUALIFIED`, then `CONVERTED` or `LOST`.
5. `CONVERTED` automatically creates and links one customer. A direct confirmed buyer can instead be added directly to Customers.
6. Create an opportunity for an active customer. Customer ownership, territory, geography and currency are inherited.
7. Move the opportunity to `WON` or `LOST`. A loss requires a reason.
8. `WON` automatically creates one revenue transaction and updates customer lifetime revenue. Repeated requests cannot create duplicate revenue.
9. Review dashboard, territory and geography analytics. Managers set targets; HR uses read-only coverage and capacity signals.

## Role boundaries

- Sales Employee: manages own leads, customers, opportunities and channel partners; views own targets, revenue and country reporting.
- Sales Manager / Department Head: manages the same workflow for the resolved reporting and territory team, assigns employees and creates team targets.
- HR Admin: receives tenant-wide read-only Sales visibility for workforce planning. HR cannot alter commercial records.
- Super Admin: can configure and correct all Sales records, including exceptional manual revenue.

All reads and writes remain tenant-scoped. Self and team actions are also checked against resolved employee, territory and geography scope on the server.
