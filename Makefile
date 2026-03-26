JOPLIN_NAME:=Joplin

.PHONY: build
build:
	npm run prepare

reopen:
	@echo "Looking for $(JOPLIN_NAME) processes..."
	@if pgrep -x "$(JOPLIN_NAME)" >/dev/null; then \
		echo "Killing $(JOPLIN_NAME) processes..."; \
		kill `pgrep $(JOPLIN_NAME)`; \
		echo "$(JOPLIN_NAME) processes (if any) should be killed now."; \
	else \
		echo "No $(JOPLIN_NAME) processes found."; \
	fi
	@open /Applications/Joplin.app