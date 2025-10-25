 // DOM elements
        const htmlCodeInput = document.getElementById('htmlCode');
        const jsCodeInput = document.getElementById('jsCode');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loader = document.getElementById('loader');
        const results = document.getElementById('results');
        const statsContainer = document.getElementById('stats');
        const elementView = document.getElementById('elementView');
        const rawView = document.getElementById('rawView');
        const themeToggle = document.getElementById('themeToggle');
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportTxtBtn = document.getElementById('exportTxtBtn');
        const tabs = document.querySelectorAll('.tab');

        // Analysis data
        let analysisData = null;

        // Initialize the application
        function initApp() {
            initTheme();
            setupEventListeners();
            // Don't auto-load sample code - let user choose
        }

        // Theme management
        function initTheme() {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.body.classList.toggle('dark-mode', savedTheme === 'dark');
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }

        function handleThemeToggle() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        }

        // Setup all event listeners
        function setupEventListeners() {
            // Theme toggle
            themeToggle.addEventListener('click', handleThemeToggle);
            
            // Tab switching
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const targetTab = e.currentTarget;
                    tabs.forEach(t => t.classList.remove('active'));
                    targetTab.classList.add('active');
                    
                    if (targetTab.dataset.view === 'element') {
                        elementView.style.display = 'block';
                        rawView.style.display = 'none';
                    } else {
                        elementView.style.display = 'none';
                        rawView.style.display = 'block';
                    }
                });
            });
            
            // Clear functionality
            clearBtn.addEventListener('click', () => {
                htmlCodeInput.value = '';
                jsCodeInput.value = '';
                results.style.display = 'none';
                analysisData = null;
            });
            
            // Export functionality
            exportJsonBtn.addEventListener('click', () => {
                if (!analysisData) {
                    alert('No analysis data to export. Please analyze code first.');
                    return;
                }
                
                const dataStr = JSON.stringify(analysisData, null, 2);
                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = 'code-analysis.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            
            exportTxtBtn.addEventListener('click', () => {
                if (!analysisData) {
                    alert('No analysis data to export. Please analyze code first.');
                    return;
                }
                
                let textContent = 'HTML + JS Code Analysis Report\n';
                textContent += '================================\n\n';
                
                textContent += `Analysis Summary:\n`;
                textContent += `- Total HTML Elements: ${analysisData.stats.totalElements}\n`;
                textContent += `- Elements with JS Interactions: ${analysisData.stats.elementsWithInteractions}\n`;
                textContent += `- Total JS Interactions: ${analysisData.stats.totalInteractions}\n`;
                textContent += `- Event Listeners: ${analysisData.stats.eventListeners}\n`;
                textContent += `- DOM Updates: ${analysisData.stats.domUpdates}\n`;
                textContent += `- Unused Elements: ${analysisData.stats.unusedElements}\n\n`;
                
                textContent += `Element Interactions:\n`;
                textContent += `=====================\n\n`;
                
                analysisData.elements.forEach(element => {
                    textContent += `Element: ${element.selector}\n`;
                    textContent += `Line: ${element.line}\n`;
                    
                    if (element.interactions.length === 0) {
                        textContent += `  No interactions found\n\n`;
                        return;
                    }
                    
                    element.interactions.forEach(interaction => {
                        textContent += `  Type: ${interaction.type}\n`;
                        textContent += `  Code: ${interaction.code}\n`;
                        textContent += `  Line: ${interaction.line}\n\n`;
                    });
                });
                
                const dataBlob = new Blob([textContent], {type: 'text/plain'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = 'code-analysis.txt';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
            
            // Analysis function
            analyzeBtn.addEventListener('click', () => {
                const htmlCode = htmlCodeInput.value.trim();
                const jsCode = jsCodeInput.value.trim();
                
                if (!htmlCode && !jsCode) {
                    alert('Please enter HTML and/or JavaScript code to analyze.');
                    return;
                }
                
                loader.style.display = 'block';
                results.style.display = 'none';
                
                // Use setTimeout to allow UI to update
                setTimeout(() => {
                    try {
                        analysisData = analyzeCode(htmlCode, jsCode);
                        displayResults(analysisData);
                    } catch (error) {
                        console.error('Analysis error:', error);
                        alert('An error occurred during analysis. Please check your code and try again.');
                    } finally {
                        loader.style.display = 'none';
                        results.style.display = 'block';
                    }
                }, 100);
            });
        }

        // Core analysis function
        function analyzeCode(htmlCode, jsCode) {
            const elements = parseHTMLElements(htmlCode);
            const jsAnalysis = parseJavaScriptWithBabel(jsCode);
            
            // Match elements with JS interactions
            const elementInteractions = matchElementsWithJS(elements, jsAnalysis);
            
            // Calculate statistics
            const stats = calculateStats(elements, elementInteractions, jsAnalysis);
            
            return {
                elements: elementInteractions,
                rawAnalysis: jsAnalysis,
                stats: stats,
                timestamp: new Date().toISOString()
            };
        }

        // Enhanced HTML parsing with line numbers
        function parseHTMLElements(htmlCode) {
            if (!htmlCode) return [];
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlCode, 'text/html');
            const allElements = doc.querySelectorAll('*');
            
            const elements = [];
            const lines = htmlCode.split('\n');
            
            allElements.forEach(element => {
                if (element.tagName === 'HTML' || element.tagName === 'HEAD' || element.tagName === 'BODY') {
                    return;
                }
                
                const selector = generateSelector(element);
                
                // Find line number by searching for the element in original HTML
                let elementLine = 1;
                const elementHtml = element.outerHTML;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(elementHtml.substring(0, 50))) {
                        elementLine = i + 1;
                        break;
                    }
                }
                
                // Check for inline event handlers
                const inlineEvents = [];
                const eventAttributes = ['onclick', 'onchange', 'oninput', 'onsubmit', 'onload', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup'];
                
                eventAttributes.forEach(attr => {
                    if (element.hasAttribute(attr)) {
                        inlineEvents.push({
                            type: `Inline ${attr}`,
                            code: element.getAttribute(attr),
                            line: elementLine,
                            category: 'event'
                        });
                    }
                });
                
                elements.push({
                    tagName: element.tagName.toLowerCase(),
                    id: element.id || null,
                    classes: element.className ? element.className.split(' ').filter(c => c) : [],
                    selector: selector,
                    text: element.textContent.trim().substring(0, 50) + (element.textContent.trim().length > 50 ? '...' : ''),
                    inlineEvents: inlineEvents,
                    line: elementLine,
                    element: element
                });
            });
            
            return elements;
        }

        // Generate CSS selector for an element
        function generateSelector(element) {
            let selector = element.tagName.toLowerCase();
            
            if (element.id) {
                selector += `#${element.id}`;
                return selector;
            }
            
            if (element.className) {
                const classes = element.className.split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                    selector += `.${classes.join('.')}`;
                }
            }
            
            return selector;
        }

        // Parse JavaScript code using Babel AST
        function parseJavaScriptWithBabel(jsCode) {
            if (!jsCode) return { 
                variables: [], 
                eventListeners: [], 
                domUpdates: [], 
                functions: [],
                elementReferences: []
            };
            
            try {
                const ast = Babel.parse(jsCode, {
                    sourceType: 'script',
                    plugins: []
                });
                
                const analysis = {
                    variables: [],
                    eventListeners: [],
                    domUpdates: [],
                    functions: [],
                    elementReferences: []
                };
                
                // Store the original JS code for extracting snippets
                const jsLines = jsCode.split('\n');
                
                // Traverse the AST
                Babel.traverse(ast, {
                    // Variable declarations for DOM elements
                    VariableDeclarator(path) {
                        const node = path.node;
                        if (node.init && node.init.type === 'CallExpression') {
                            const callee = node.init.callee;
                            
                            if (callee.type === 'MemberExpression' &&
                                callee.object.name === 'document' &&
                                ['getElementById', 'querySelector', 'querySelectorAll', 'getElementsByClassName', 'getElementsByTagName'].includes(callee.property.name)) {
                                
                                if (node.init.arguments.length > 0 && node.init.arguments[0].type === 'StringLiteral') {
                                    const selector = node.init.arguments[0].value;
                                    const line = node.loc.start.line;
                                    const code = jsLines[line - 1]?.trim() || '';
                                    
                                    analysis.variables.push({
                                        name: node.id.name,
                                        method: callee.property.name,
                                        selector: selector,
                                        line: line,
                                        category: 'declaration',
                                        code: code
                                    });
                                    
                                    // Also store as element reference
                                    analysis.elementReferences.push({
                                        variable: node.id.name,
                                        selector: selector,
                                        method: callee.property.name,
                                        line: line
                                    });
                                }
                            }
                        }
                    },
                    
                    // Event listeners
                    CallExpression(path) {
                        const node = path.node;
                        if (node.callee.type === 'MemberExpression' &&
                            node.callee.property.name === 'addEventListener' &&
                            node.arguments.length >= 2) {
                            
                            const eventName = node.arguments[0].type === 'StringLiteral' ? node.arguments[0].value : 'unknown';
                            let handlerName = 'anonymous';
                            
                            if (node.arguments[1].type === 'Identifier') {
                                handlerName = node.arguments[1].name;
                            } else if (node.arguments[1].type === 'FunctionExpression') {
                                handlerName = 'anonymous function';
                            }
                            
                            const line = node.loc.start.line;
                            const code = jsLines[line - 1]?.trim() || '';
                            
                            analysis.eventListeners.push({
                                event: eventName,
                                handler: handlerName,
                                line: line,
                                category: 'event',
                                code: code,
                                element: node.callee.object.name
                            });
                        }
                    },
                    
                    // DOM updates - innerHTML, textContent, etc.
                    AssignmentExpression(path) {
                        const node = path.node;
                        if (node.left.type === 'MemberExpression') {
                            const property = node.left.property;
                            const domProperties = ['innerHTML', 'textContent', 'value', 'style'];
                            
                            if (property && domProperties.includes(property.name)) {
                                const line = node.loc.start.line;
                                const code = jsLines[line - 1]?.trim() || '';
                                const elementRef = node.left.object.name;
                                
                                analysis.domUpdates.push({
                                    type: property.name,
                                    line: line,
                                    category: 'update',
                                    code: code,
                                    element: elementRef
                                });
                            }
                        }
                    },
                    
                    // Function definitions
                    FunctionDeclaration(path) {
                        const node = path.node;
                        const line = node.loc.start.line;
                        const code = jsLines.slice(line - 1, node.loc.end.line).join('\n');
                        
                        analysis.functions.push({
                            name: node.id ? node.id.name : 'anonymous',
                            line: line,
                            code: code.substring(0, 200) + (code.length > 200 ? '...' : '')
                        });
                    }
                });
                
                return analysis;
            } catch (error) {
                console.error('Babel parsing error:', error);
                // Fall back to regex-based parsing if Babel fails
                return parseJavaScriptWithRegex(jsCode);
            }
        }

        // Fallback regex-based parser
        function parseJavaScriptWithRegex(jsCode) {
            const analysis = {
                variables: [],
                eventListeners: [],
                domUpdates: [],
                functions: [],
                elementReferences: []
            };
            
            const lines = jsCode.split('\n');
            
            // Extract variable declarations
            const varRegex = /(const|let|var)\s+(\w+)\s*=\s*document\.(getElementById|querySelector|querySelectorAll|getElementsByClassName|getElementsByTagName)\(['"`]([^'"`]+)['"`]\)/g;
            let match;
            
            while ((match = varRegex.exec(jsCode)) !== null) {
                const line = getLineNumber(jsCode, match.index);
                analysis.variables.push({
                    name: match[2],
                    method: match[3],
                    selector: match[4],
                    line: line,
                    category: 'declaration',
                    code: lines[line - 1]?.trim() || match[0]
                });
                
                analysis.elementReferences.push({
                    variable: match[2],
                    selector: match[4],
                    method: match[3],
                    line: line
                });
            }
            
            // Extract event listeners
            const eventRegex = /(\w+)\.addEventListener\(['"`](\w+)['"`],\s*([^)]+)\)/g;
            while ((match = eventRegex.exec(jsCode)) !== null) {
                const line = getLineNumber(jsCode, match.index);
                analysis.eventListeners.push({
                    element: match[1],
                    event: match[2],
                    handler: match[3],
                    line: line,
                    category: 'event',
                    code: lines[line - 1]?.trim() || match[0]
                });
            }
            
            // Extract DOM updates
            const updateRegex = /(\w+)\.(innerHTML|textContent|value)\s*=[^;]+;/g;
            while ((match = updateRegex.exec(jsCode)) !== null) {
                const line = getLineNumber(jsCode, match.index);
                analysis.domUpdates.push({
                    element: match[1],
                    type: match[2],
                    line: line,
                    category: 'update',
                    code: lines[line - 1]?.trim() || match[0]
                });
            }
            
            // Extract function definitions
            const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
            while ((match = functionRegex.exec(jsCode)) !== null) {
                const line = getLineNumber(jsCode, match.index);
                analysis.functions.push({
                    name: match[1],
                    line: line,
                    code: lines[line - 1]?.trim() || match[0]
                });
            }
            
            return analysis;
        }

        // Get line number from index in code string
        function getLineNumber(code, index) {
            return code.substring(0, index).split('\n').length;
        }

        // Match elements with JS interactions using accurate selector matching
        function matchElementsWithJS(elements, jsAnalysis) {
            return elements.map(element => {
                const interactions = [];
                
                // Check for variable declarations that reference this element
                jsAnalysis.variables.forEach(variable => {
                    if (matchesSelector(element.element, variable.selector, variable.method)) {
                        interactions.push({
                            type: 'Variable Declaration',
                            code: variable.code,
                            line: variable.line,
                            category: 'declaration'
                        });
                    }
                });
                
                // Check for event listeners on variables that reference this element
                jsAnalysis.eventListeners.forEach(event => {
                    // Find which variable this event listener is attached to
                    const variableRef = jsAnalysis.elementReferences.find(ref => ref.variable === event.element);
                    if (variableRef && matchesSelector(element.element, variableRef.selector, variableRef.method)) {
                        interactions.push({
                            type: `Event Listener (${event.event})`,
                            code: event.code,
                            line: event.line,
                            category: 'event'
                        });
                    }
                });
                
                // Check for DOM updates on variables that reference this element
                jsAnalysis.domUpdates.forEach(update => {
                    // Find which variable this update is performed on
                    const variableRef = jsAnalysis.elementReferences.find(ref => ref.variable === update.element);
                    if (variableRef && matchesSelector(element.element, variableRef.selector, variableRef.method)) {
                        interactions.push({
                            type: `DOM Update (${update.type})`,
                            code: update.code,
                            line: update.line,
                            category: 'update'
                        });
                    }
                });
                
                // Add inline events from HTML
                element.inlineEvents.forEach(event => {
                    interactions.push({
                        type: event.type,
                        code: event.code,
                        line: event.line,
                        category: 'event'
                    });
                });
                
                return {
                    ...element,
                    interactions: interactions
                };
            });
        }

        // Accurate selector matching
        function matchesSelector(element, selector, method) {
            if (!element || !selector) return false;
            
            try {
                switch (method) {
                    case 'getElementById':
                        return element.id === selector;
                    case 'querySelector':
                        try {
                            // Create temporary context to test selector
                            const tempDiv = document.createElement('div');
                            const clone = element.cloneNode(true);
                            tempDiv.appendChild(clone);
                            return tempDiv.querySelector(selector) !== null;
                        } catch (e) {
                            return false;
                        }
                    case 'querySelectorAll':
                        try {
                            const tempDiv = document.createElement('div');
                            const clone = element.cloneNode(true);
                            tempDiv.appendChild(clone);
                            return tempDiv.querySelectorAll(selector).length > 0;
                        } catch (e) {
                            return false;
                        }
                    case 'getElementsByClassName':
                        return element.classList.contains(selector.replace('.', ''));
                    case 'getElementsByTagName':
                        return element.tagName.toLowerCase() === selector.toLowerCase();
                    default:
                        return false;
                }
            } catch (error) {
                console.error('Selector matching error:', error);
                return false;
            }
        }

        // Calculate statistics
        function calculateStats(elements, elementInteractions, jsAnalysis) {
            const elementsWithInteractions = elementInteractions.filter(el => el.interactions.length > 0).length;
            const totalInteractions = elementInteractions.reduce((sum, el) => sum + el.interactions.length, 0);
            const eventListeners = jsAnalysis.eventListeners.length + 
                elementInteractions.reduce((sum, el) => sum + el.inlineEvents.length, 0);
            const domUpdates = jsAnalysis.domUpdates.length;
            const unusedElements = elements.length - elementsWithInteractions;
            
            return {
                totalElements: elements.length,
                elementsWithInteractions: elementsWithInteractions,
                totalInteractions: totalInteractions,
                eventListeners: eventListeners,
                domUpdates: domUpdates,
                unusedElements: unusedElements
            };
        }

        // Display results with enhanced features
        function displayResults(data) {
            // Update stats
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${data.stats.totalElements}</div>
                    <div>HTML Elements</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.elementsWithInteractions}</div>
                    <div>Elements with JS</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.totalInteractions}</div>
                    <div>Total Interactions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.eventListeners}</div>
                    <div>Event Listeners</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.domUpdates}</div>
                    <div>DOM Updates</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${data.stats.unusedElements}</div>
                    <div>Unused Elements</div>
                </div>
            `;
            
            // Display element view
            displayElementView(data.elements);
            
            // Display raw view
            displayRawView(data.rawAnalysis);
        }

        function displayElementView(elements) {
            elementView.innerHTML = '';
            
            if (elements.length === 0) {
                elementView.innerHTML = '<div class="empty-state">No HTML elements found to analyze.</div>';
                return;
            }
            
            // Sort elements: interactive first, then unused
            const sortedElements = [...elements].sort((a, b) => {
                if (a.interactions.length > 0 && b.interactions.length === 0) return -1;
                if (a.interactions.length === 0 && b.interactions.length > 0) return 1;
                return 0;
            });
            
            sortedElements.forEach(element => {
                const panel = document.createElement('div');
                panel.className = 'element-panel';
                
                const header = document.createElement('div');
                header.className = 'element-header';
                
                const isUnused = element.interactions.length === 0;
                
                header.innerHTML = `
                    <div>
                        <strong>${element.selector}</strong>
                        <span style="margin-left: 10px; font-size: 0.9em; color: ${isUnused ? '#f44336' : '#666'};">
                            ${element.interactions.length} interaction${element.interactions.length !== 1 ? 's' : ''}
                        </span>
                        <div class="html-line-info">HTML Line: ${element.line}</div>
                    </div>
                    <div>${element.interactions.length > 0 ? '▼' : '●'}</div>
                `;
                
                const content = document.createElement('div');
                content.className = 'element-content';
                
                if (isUnused) {
                    content.innerHTML = `
                        <div class="action-item unused">
                            <div class="action-type">🔴 No JavaScript Interactions Found</div>
                            <p>This element doesn't have any detected JavaScript interactions.</p>
                        </div>
                    `;
                } else {
                    element.interactions.forEach(interaction => {
                        const actionItem = document.createElement('div');
                        let icon = '🔵';
                        let className = 'event';
                        
                        if (interaction.category === 'declaration') {
                            icon = '🟢';
                            className = 'declaration';
                        } else if (interaction.category === 'update') {
                            icon = '🟣';
                            className = 'update';
                        }
                        
                        actionItem.className = `action-item ${className}`;
                        
                        // Use Prism for syntax highlighting if available
                        let codeHtml = interaction.code;
                        if (window.Prism) {
                            codeHtml = Prism.highlight(interaction.code, Prism.languages.javascript, 'javascript');
                        } else {
                            // Basic formatting if Prism is not available
                            codeHtml = interaction.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        }
                        
                        actionItem.innerHTML = `
                            <div class="action-type">${icon} ${interaction.type}</div>
                            <div class="code-snippet">
                                <button class="copy-btn">Copy</button>
                                <pre><code class="language-javascript">${codeHtml}</code></pre>
                            </div>
                            <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                                JS Line: ${interaction.line}
                            </div>
                        `;
                        
                        // Add copy functionality
                        const copyBtn = actionItem.querySelector('.copy-btn');
                        copyBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(interaction.code)
                                .then(() => {
                                    copyBtn.textContent = 'Copied!';
                                    setTimeout(() => {
                                        copyBtn.textContent = 'Copy';
                                    }, 2000);
                                })
                                .catch(err => {
                                    console.error('Failed to copy: ', err);
                                });
                        });
                        
                        content.appendChild(actionItem);
                    });
                }
                
                // Toggle expand/collapse for interactive elements
                if (!isUnused) {
                    header.addEventListener('click', () => {
                        content.classList.toggle('expanded');
                        header.querySelector('div:last-child').textContent = 
                            content.classList.contains('expanded') ? '▲' : '▼';
                    });
                    
                    // Auto-expand if only a few interactions
                    if (element.interactions.length <= 3) {
                        content.classList.add('expanded');
                        header.querySelector('div:last-child').textContent = '▲';
                    }
                }
                
                panel.appendChild(header);
                panel.appendChild(content);
                elementView.appendChild(panel);
            });
        }

        function displayRawView(rawAnalysis) {
            rawView.innerHTML = '';
            
            if (Object.keys(rawAnalysis).length === 0 || 
                (rawAnalysis.variables.length === 0 && rawAnalysis.eventListeners.length === 0 && 
                 rawAnalysis.domUpdates.length === 0 && rawAnalysis.functions.length === 0)) {
                rawView.innerHTML = '<div class="empty-state">No JavaScript code found to analyze.</div>';
                return;
            }
            
            // Create raw analysis view
            const analysis = rawAnalysis;
            
            // Variables section
            if (analysis.variables.length > 0) {
                const section = document.createElement('div');
                section.className = 'card';
                section.innerHTML = `
                    <h3>Variable Declarations</h3>
                    <p>Found ${analysis.variables.length} DOM element reference(s)</p>
                `;
                
                analysis.variables.forEach(variable => {
                    const item = document.createElement('div');
                    item.className = 'action-item declaration';
                    
                    let codeHtml = variable.code;
                    if (window.Prism) {
                        codeHtml = Prism.highlight(variable.code, Prism.languages.javascript, 'javascript');
                    }
                    
                    item.innerHTML = `
                        <div class="action-type">🟢 ${variable.method}('${variable.selector}')</div>
                        <div class="code-snippet">
                            <button class="copy-btn">Copy</button>
                            <pre><code class="language-javascript">${codeHtml}</code></pre>
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            Line: ${variable.line} | Variable: ${variable.name}
                        </div>
                    `;
                    
                    // Add copy functionality
                    const copyBtn = item.querySelector('.copy-btn');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(variable.code)
                            .then(() => {
                                copyBtn.textContent = 'Copied!';
                                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                            })
                            .catch(err => console.error('Failed to copy:', err));
                    });
                    
                    section.appendChild(item);
                });
                
                rawView.appendChild(section);
            }
            
            // Event listeners section
            if (analysis.eventListeners.length > 0) {
                const section = document.createElement('div');
                section.className = 'card';
                section.innerHTML = `
                    <h3>Event Listeners</h3>
                    <p>Found ${analysis.eventListeners.length} event listener(s)</p>
                `;
                
                analysis.eventListeners.forEach(event => {
                    const item = document.createElement('div');
                    item.className = 'action-item event';
                    
                    let codeHtml = event.code;
                    if (window.Prism) {
                        codeHtml = Prism.highlight(event.code, Prism.languages.javascript, 'javascript');
                    }
                    
                    item.innerHTML = `
                        <div class="action-type">🔵 ${event.element}.addEventListener('${event.event}', ${event.handler})</div>
                        <div class="code-snippet">
                            <button class="copy-btn">Copy</button>
                            <pre><code class="language-javascript">${codeHtml}</code></pre>
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            Line: ${event.line}
                        </div>
                    `;
                    
                    const copyBtn = item.querySelector('.copy-btn');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(event.code)
                            .then(() => {
                                copyBtn.textContent = 'Copied!';
                                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                            })
                            .catch(err => console.error('Failed to copy:', err));
                    });
                    
                    section.appendChild(item);
                });
                
                rawView.appendChild(section);
            }
            
            // DOM updates section
            if (analysis.domUpdates.length > 0) {
                const section = document.createElement('div');
                section.className = 'card';
                section.innerHTML = `
                    <h3>DOM Updates</h3>
                    <p>Found ${analysis.domUpdates.length} DOM update(s)</p>
                `;
                
                analysis.domUpdates.forEach(update => {
                    const item = document.createElement('div');
                    item.className = 'action-item update';
                    
                    let codeHtml = update.code;
                    if (window.Prism) {
                        codeHtml = Prism.highlight(update.code, Prism.languages.javascript, 'javascript');
                    }
                    
                    item.innerHTML = `
                        <div class="action-type">🟣 ${update.element}.${update.type}</div>
                        <div class="code-snippet">
                            <button class="copy-btn">Copy</button>
                            <pre><code class="language-javascript">${codeHtml}</code></pre>
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            Line: ${update.line}
                        </div>
                    `;
                    
                    const copyBtn = item.querySelector('.copy-btn');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(update.code)
                            .then(() => {
                                copyBtn.textContent = 'Copied!';
                                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                            })
                            .catch(err => console.error('Failed to copy:', err));
                    });
                    
                    section.appendChild(item);
                });
                
                rawView.appendChild(section);
            }
            
            // Functions section
            if (analysis.functions.length > 0) {
                const section = document.createElement('div');
                section.className = 'card';
                section.innerHTML = `
                    <h3>Function Definitions</h3>
                    <p>Found ${analysis.functions.length} function(s)</p>
                `;
                
                analysis.functions.forEach(func => {
                    const item = document.createElement('div');
                    item.className = 'action-item';
                    
                    let codeHtml = func.code;
                    if (window.Prism) {
                        codeHtml = Prism.highlight(func.code, Prism.languages.javascript, 'javascript');
                    }
                    
                    item.innerHTML = `
                        <div class="action-type">function ${func.name}()</div>
                        <div class="code-snippet">
                            <button class="copy-btn">Copy</button>
                            <pre><code class="language-javascript">${codeHtml}</code></pre>
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            Line: ${func.line}
                        </div>
                    `;
                    
                    const copyBtn = item.querySelector('.copy-btn');
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(func.code)
                            .then(() => {
                                copyBtn.textContent = 'Copied!';
                                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                            })
                            .catch(err => console.error('Failed to copy:', err));
                    });
                    
                    section.appendChild(item);
                });
                
                rawView.appendChild(section);
            }
        }

        // Initialize the application when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);