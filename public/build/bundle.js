
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var internshipsData = [
    	{
    		positionName: "Stage de développeur web",
    		companyName: "Nom de la société",
    		salary: "3500€",
    		contactEmail: "contact@techcorp.com",
    		website: "https://google.com"
    	},
    	{
    		companyName: "Igeneve",
    		positionName: "Stagiaire développeur web",
    		salary: "1000CHF brute",
    		contactEmail: "dimitri@igeneve.com",
    		website: "https://igeneve.com"
    	},
    	{
    		companyName: "MapSarch",
    		positionName: "Stagiaire développeur full stack",
    		salary: "300CHF",
    		contactEmail: "mathisi@mapsarch.com",
    		website: "https://mapsarch.com"
    	}
    ];

    const internships = writable(internshipsData);

    /* src\components\Internships.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\Internships.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (6:2) {#each $internships as internship}
    function create_each_block(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*internship*/ ctx[1].positionName + "";
    	let t0;
    	let t1;
    	let t2_value = /*internship*/ ctx[1].companyName + "";
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let t5_value = /*internship*/ ctx[1].salary + "";
    	let t5;
    	let t6;
    	let p1;
    	let t7;
    	let a0;
    	let t8_value = /*internship*/ ctx[1].contactEmail + "";
    	let t8;
    	let a0_href_value;
    	let t9;
    	let p2;
    	let t10;
    	let a1;
    	let t11_value = /*internship*/ ctx[1].website + "";
    	let t11;
    	let a1_href_value;
    	let t12;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Salaire: ");
    			t5 = text(t5_value);
    			t6 = space();
    			p1 = element("p");
    			t7 = text("Contact: ");
    			a0 = element("a");
    			t8 = text(t8_value);
    			t9 = space();
    			p2 = element("p");
    			t10 = text("Website: ");
    			a1 = element("a");
    			t11 = text(t11_value);
    			t12 = space();
    			attr_dev(h2, "class", "svelte-c1491l");
    			add_location(h2, file$2, 7, 6, 197);
    			attr_dev(p0, "class", "salary svelte-c1491l");
    			add_location(p0, file$2, 8, 6, 266);
    			attr_dev(a0, "href", a0_href_value = "mailto:" + /*internship*/ ctx[1].contactEmail);
    			attr_dev(a0, "class", "svelte-c1491l");
    			add_location(a0, file$2, 10, 17, 362);
    			attr_dev(p1, "class", "contact svelte-c1491l");
    			add_location(p1, file$2, 9, 6, 324);
    			attr_dev(a1, "href", a1_href_value = /*internship*/ ctx[1].website);
    			attr_dev(a1, "class", "svelte-c1491l");
    			add_location(a1, file$2, 16, 21, 547);
    			attr_dev(p2, "class", "contact svelte-c1491l");
    			add_location(p2, file$2, 15, 8, 505);
    			attr_dev(div, "class", "internship svelte-c1491l");
    			add_location(div, file$2, 6, 4, 165);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div, t3);
    			append_dev(div, p0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(div, t6);
    			append_dev(div, p1);
    			append_dev(p1, t7);
    			append_dev(p1, a0);
    			append_dev(a0, t8);
    			append_dev(div, t9);
    			append_dev(div, p2);
    			append_dev(p2, t10);
    			append_dev(p2, a1);
    			append_dev(a1, t11);
    			append_dev(div, t12);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$internships*/ 1 && t0_value !== (t0_value = /*internship*/ ctx[1].positionName + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$internships*/ 1 && t2_value !== (t2_value = /*internship*/ ctx[1].companyName + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$internships*/ 1 && t5_value !== (t5_value = /*internship*/ ctx[1].salary + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*$internships*/ 1 && t8_value !== (t8_value = /*internship*/ ctx[1].contactEmail + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*$internships*/ 1 && a0_href_value !== (a0_href_value = "mailto:" + /*internship*/ ctx[1].contactEmail)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*$internships*/ 1 && t11_value !== (t11_value = /*internship*/ ctx[1].website + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*$internships*/ 1 && a1_href_value !== (a1_href_value = /*internship*/ ctx[1].website)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(6:2) {#each $internships as internship}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_value = /*$internships*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "internships-container svelte-c1491l");
    			add_location(div, file$2, 4, 0, 86);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$internships*/ 1) {
    				each_value = /*$internships*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $internships;
    	validate_store(internships, 'internships');
    	component_subscribe($$self, internships, $$value => $$invalidate(0, $internships = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Internships', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Internships> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ internships, $internships });
    	return [$internships];
    }

    class Internships extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Internships",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\AdminDashboard.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\components\\AdminDashboard.svelte";

    function create_fragment$1(ctx) {
    	let form;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let input2;
    	let t2;
    	let input3;
    	let t3;
    	let input4;
    	let t4;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			input2 = element("input");
    			t2 = space();
    			input3 = element("input");
    			t3 = space();
    			input4 = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Ajouter le stage";
    			attr_dev(input0, "placeholder", "Position Name");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1tpamg2");
    			add_location(input0, file$1, 14, 4, 496);
    			attr_dev(input1, "placeholder", "Company Name");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1tpamg2");
    			add_location(input1, file$1, 19, 4, 606);
    			attr_dev(input2, "placeholder", "Salary");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-1tpamg2");
    			add_location(input2, file$1, 24, 4, 714);
    			attr_dev(input3, "placeholder", "Contact Email");
    			attr_dev(input3, "type", "email");
    			input3.required = true;
    			attr_dev(input3, "class", "svelte-1tpamg2");
    			add_location(input3, file$1, 29, 4, 811);
    			attr_dev(input4, "placeholder", "Website");
    			attr_dev(input4, "type", "url");
    			input4.required = true;
    			attr_dev(input4, "class", "svelte-1tpamg2");
    			add_location(input4, file$1, 36, 4, 968);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-1tpamg2");
    			add_location(button, file$1, 42, 4, 1087);
    			attr_dev(form, "class", "svelte-1tpamg2");
    			add_location(form, file$1, 13, 0, 443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input0);
    			set_input_value(input0, /*positionName*/ ctx[0]);
    			append_dev(form, t0);
    			append_dev(form, input1);
    			set_input_value(input1, /*companyName*/ ctx[1]);
    			append_dev(form, t1);
    			append_dev(form, input2);
    			set_input_value(input2, /*salary*/ ctx[2]);
    			append_dev(form, t2);
    			append_dev(form, input3);
    			set_input_value(input3, /*contactEmail*/ ctx[3]);
    			append_dev(form, t3);
    			append_dev(form, input4);
    			set_input_value(input4, /*website*/ ctx[4]);
    			append_dev(form, t4);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[8]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[9]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[10]),
    					listen_dev(form, "submit", prevent_default(/*addInternship*/ ctx[5]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*positionName*/ 1 && input0.value !== /*positionName*/ ctx[0]) {
    				set_input_value(input0, /*positionName*/ ctx[0]);
    			}

    			if (dirty & /*companyName*/ 2 && input1.value !== /*companyName*/ ctx[1]) {
    				set_input_value(input1, /*companyName*/ ctx[1]);
    			}

    			if (dirty & /*salary*/ 4 && input2.value !== /*salary*/ ctx[2]) {
    				set_input_value(input2, /*salary*/ ctx[2]);
    			}

    			if (dirty & /*contactEmail*/ 8 && input3.value !== /*contactEmail*/ ctx[3]) {
    				set_input_value(input3, /*contactEmail*/ ctx[3]);
    			}

    			if (dirty & /*website*/ 16 && input4.value !== /*website*/ ctx[4]) {
    				set_input_value(input4, /*website*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AdminDashboard', slots, []);
    	let positionName, companyName, salary, contactEmail, website;

    	function addInternship() {
    		internships.update(current => [
    			...current,
    			{
    				positionName,
    				companyName,
    				salary,
    				contactEmail,
    				website
    			}
    		]);

    		$$invalidate(0, positionName = $$invalidate(1, companyName = $$invalidate(2, salary = $$invalidate(3, contactEmail = $$invalidate(4, website = ''))))); // Reset fields
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AdminDashboard> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		positionName = this.value;
    		$$invalidate(0, positionName);
    	}

    	function input1_input_handler() {
    		companyName = this.value;
    		$$invalidate(1, companyName);
    	}

    	function input2_input_handler() {
    		salary = this.value;
    		$$invalidate(2, salary);
    	}

    	function input3_input_handler() {
    		contactEmail = this.value;
    		$$invalidate(3, contactEmail);
    	}

    	function input4_input_handler() {
    		website = this.value;
    		$$invalidate(4, website);
    	}

    	$$self.$capture_state = () => ({
    		internships,
    		positionName,
    		companyName,
    		salary,
    		contactEmail,
    		website,
    		addInternship
    	});

    	$$self.$inject_state = $$props => {
    		if ('positionName' in $$props) $$invalidate(0, positionName = $$props.positionName);
    		if ('companyName' in $$props) $$invalidate(1, companyName = $$props.companyName);
    		if ('salary' in $$props) $$invalidate(2, salary = $$props.salary);
    		if ('contactEmail' in $$props) $$invalidate(3, contactEmail = $$props.contactEmail);
    		if ('website' in $$props) $$invalidate(4, website = $$props.website);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		positionName,
    		companyName,
    		salary,
    		contactEmail,
    		website,
    		addInternship,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class AdminDashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AdminDashboard",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */
    const file = "src\\App.svelte";

    // (15:27) 
    function create_if_block_1(ctx) {
    	let admindashboard;
    	let current;
    	admindashboard = new AdminDashboard({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(admindashboard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(admindashboard, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(admindashboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(admindashboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(admindashboard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:27) ",
    		ctx
    	});

    	return block;
    }

    // (13:0) {#if page === 'home'}
    function create_if_block(ctx) {
    	let internships;
    	let current;
    	internships = new Internships({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(internships.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(internships, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(internships.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(internships.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(internships, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(13:0) {#if page === 'home'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_class_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_class_value;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] === 'home') return 0;
    		if (/*page*/ ctx[0] === 'admin') return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Home");
    			t1 = space();
    			button1 = element("button");
    			t2 = text("Admin");
    			t3 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(button0, "class", button0_class_value = "" + (null_to_empty(/*page*/ ctx[0] === 'home' ? 'active' : '') + " svelte-1a4t4r3"));
    			add_location(button0, file, 8, 4, 265);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*page*/ ctx[0] === 'admin' ? 'active' : '') + " svelte-1a4t4r3"));
    			add_location(button1, file, 9, 4, 363);
    			attr_dev(div, "class", "tab-bar svelte-1a4t4r3");
    			add_location(div, file, 7, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, t2);
    			insert_dev(target, t3, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*page*/ 1 && button0_class_value !== (button0_class_value = "" + (null_to_empty(/*page*/ ctx[0] === 'home' ? 'active' : '') + " svelte-1a4t4r3"))) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (!current || dirty & /*page*/ 1 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*page*/ ctx[0] === 'admin' ? 'active' : '') + " svelte-1a4t4r3"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let page = 'home'; // 'home' or 'admin'
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, page = 'home');
    	const click_handler_1 = () => $$invalidate(0, page = 'admin');
    	$$self.$capture_state = () => ({ Internships, AdminDashboard, page });

    	$$self.$inject_state = $$props => {
    		if ('page' in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
