# Library Management Database Schema

## Required Tables for Supabase

Run these SQL commands in your Supabase SQL Editor to create the library management system tables:

```sql
-- Create libraries table (main library containers)
CREATE TABLE libraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create book management table
CREATE TABLE book_management (
  id SERIAL PRIMARY KEY,
  b_code INT NOT NULL,
  b_name VARCHAR(255) NOT NULL,
  b_author VARCHAR(255) NOT NULL,
  b_price DECIMAL(10,2) NOT NULL,
  library_id UUID REFERENCES libraries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(b_code, library_id) -- Ensure book codes are unique within each library
);

-- Create member management table
CREATE TABLE member_management (
  id SERIAL PRIMARY KEY,
  m_code INT NOT NULL,
  m_name VARCHAR(255) NOT NULL,
  m_phone BIGINT NOT NULL,
  library_id UUID REFERENCES libraries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(m_code, library_id) -- Ensure member codes are unique within each library
);

-- Create issue management table
CREATE TABLE issue_management (
  id SERIAL PRIMARY KEY,
  ib_code INT NOT NULL,
  im_code INT NOT NULL,
  i_date_of_iss DATE NOT NULL,
  i_date_of_ret DATE,
  library_id UUID REFERENCES libraries(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  FOREIGN KEY (ib_code, library_id) REFERENCES book_management(b_code, library_id),
  FOREIGN KEY (im_code, library_id) REFERENCES member_management(m_code, library_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_management ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for libraries table
CREATE POLICY "Users can view own libraries" ON libraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own libraries" ON libraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own libraries" ON libraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own libraries" ON libraries
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for book_management table
CREATE POLICY "Users can view books in own libraries" ON book_management
  FOR SELECT USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert books in own libraries" ON book_management
  FOR INSERT WITH CHECK (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update books in own libraries" ON book_management
  FOR UPDATE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete books in own libraries" ON book_management
  FOR DELETE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for member_management table
CREATE POLICY "Users can view members in own libraries" ON member_management
  FOR SELECT USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert members in own libraries" ON member_management
  FOR INSERT WITH CHECK (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update members in own libraries" ON member_management
  FOR UPDATE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete members in own libraries" ON member_management
  FOR DELETE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

-- Create RLS Policies for issue_management table
CREATE POLICY "Users can view issues in own libraries" ON issue_management
  FOR SELECT USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert issues in own libraries" ON issue_management
  FOR INSERT WITH CHECK (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update issues in own libraries" ON issue_management
  FOR UPDATE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete issues in own libraries" ON issue_management
  FOR DELETE USING (
    library_id IN (
      SELECT id FROM libraries WHERE user_id = auth.uid()
    )
  );

-- Create updated_at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_libraries_updated_at 
  BEFORE UPDATE ON libraries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_management_updated_at 
  BEFORE UPDATE ON book_management 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_management_updated_at 
  BEFORE UPDATE ON member_management 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issue_management_updated_at 
  BEFORE UPDATE ON issue_management 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## Database Structure Overview

### Tables:

1. **libraries**: Main container for each library instance
   - `id`: UUID primary key
   - `name`: Library name
   - `description`: Library description
   - `user_id`: References auth.users(id)

2. **book_management**: Books in the library
   - `b_code`: Book code (unique within library)
   - `b_name`: Book name
   - `b_author`: Book author
   - `b_price`: Book price
   - `library_id`: References libraries(id)

3. **member_management**: Library members
   - `m_code`: Member code (unique within library)
   - `m_name`: Member name
   - `m_phone`: Member phone number
   - `library_id`: References libraries(id)

4. **issue_management**: Book issues/returns
   - `ib_code`: Book code being issued
   - `im_code`: Member code receiving the book
   - `i_date_of_iss`: Issue date
   - `i_date_of_ret`: Return date (null if not returned)
   - `library_id`: References libraries(id)

### Features Implemented:

- **Row Level Security**: Users can only access their own libraries and related data
- **Foreign Key Constraints**: Maintain data integrity
- **Unique Constraints**: Prevent duplicate codes within libraries
- **Automatic Timestamps**: Track creation and update times
- **Cascading Deletes**: Remove related data when libraries are deleted

### Next Steps:

1. Run the SQL commands in Supabase SQL Editor
2. Verify tables are created successfully
3. Test the dashboard functionality
4. Implement the CRUD operations for books, members, and issues 